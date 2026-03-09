/*
 * @Description: 图层管理器（单例模式）
 * LayerManager 专注于 Cesium 操作，不管理 store 状态
 */

import { createWmsImageryLayer, createWmtsImageryLayer, create3DTilesLayer } from './utils/ImageryLayerUtils';
import { computeMergedBounds } from './utils/GeoJsonValidator';
import {
  GeographicTilingScheme,
  WebMercatorTilingScheme,
  HeadingPitchRange,
  Math as CesiumMath,
  Color,
  Cartesian2,
  Cartesian3,
  Rectangle,
  Ellipsoid,
  GeoJsonDataSource,
  Cesium3DTileStyle,
  Cesium3DTileColorBlendMode,
  Matrix3,
  LabelStyle,
  HorizontalOrigin,
  VerticalOrigin,
  Quaternion,
  EllipsoidTerrainProvider,
  BoundingSphere,
} from 'cesium';

/**
 * @typedef {import("cesium").Viewer} Viewer
 * @typedef {import("cesium").Cesium3DTileset} Cesium3DTileset
 * @typedef {import("cesium").GeoJsonDataSource} GeoJsonDataSource
 */

class LayerManager {
  /** @type {Viewer} */
  #viewer; // 私有属性
  static #instance; // 单例实例 静态私有属性
  #tilesetVisualizations; // 存储每个 tileset 的可视化实体集合

  constructor(viewer) {
    if (LayerManager.#instance) {
      return LayerManager.#instance;
    }

    this.#viewer = viewer;
    this.#tilesetVisualizations = new WeakMap(); // 使用 WeakMap 自动管理内存

    LayerManager.#instance = this;
  }

  /**
   * 获取LayerManager实例
   * @param {Cesium.Viewer} viewer - Cesium Viewer实例
   * @returns {LayerManager} LayerManager实例
   */
  static getInstance(viewer) {
    if (!LayerManager.#instance && viewer) {
      LayerManager.#instance = new LayerManager(viewer);
    }
    return LayerManager.#instance;
  }

  /**
   * 添加WMS图层
   * @param {Object} wmsOptions - 图层选项
   * @returns {Promise<Cesium.ImageryLayer>} 返回创建图层的Promise
   */
  addWmsLayer(wmsOptions) {
    console.log('addWmsLayer', wmsOptions);

    // 根据 srs/crs 自动设置 tilingScheme，确保 bbox 坐标系统与 srs 一致
    const srsOrCrs = wmsOptions.srs ?? wmsOptions.crs ?? '';
    const epsgCode = String(srsOrCrs).replace(/^EPSG:/i, '');
    const tilingScheme =
      epsgCode === '3857'
        ? new WebMercatorTilingScheme()
        : epsgCode === '4326'
          ? new GeographicTilingScheme()
          : undefined;

    const enrichedOptions = {
      ...wmsOptions,
      ...(tilingScheme ? { tilingScheme } : {}),
    };

    return createWmsImageryLayer(enrichedOptions)
      .then(layer => {
        if (layer) {
          // 确保图层被添加到viewer中
          this.#viewer.imageryLayers.add(layer);
          return layer;
        }
        return null;
      });
  }

  /**
   * 添加WMTS图层
   * @param {Object} wmtsOptions - WMTS图层选项
   * @returns {Promise<Cesium.ImageryLayer>} 返回创建图层的Promise
   */
  addWmtsLayer(wmtsOptions) {
    console.log('addWmtsLayer', wmtsOptions);
    return createWmtsImageryLayer(wmtsOptions)
      .then(layer => {
        if (layer) {
          // 确保图层被添加到viewer中
          this.#viewer.imageryLayers.add(layer);
          return layer;
        }
        return null;
      });
  }


  /**
   * 添加 Cesium 3DTiles 模型
   * @param {Object} tilesOptions - 3DTiles 配置项
   * @param {string} tilesOptions.url - tileset.json 的 URL
   * @param {number} tilesOptions.maximumScreenSpaceError - 屏幕空间误差（默认 16）
   * @param {Object} [options] - 可选参数，如 { skipZoom: true } 恢复时跳过自动聚焦
   * @returns {Promise<Object>} 返回 tileset 实例的 Promise
   */
  async add3DTilesLayer(tilesOptions, options) {
    console.log('add3DTilesLayer', tilesOptions);
    try {
      // 1. 使用工具函数创建 3DTiles 模型
      const tileset = await create3DTilesLayer(tilesOptions);

      // 2. 添加到 Cesium viewer 的 primitives
      this.#viewer.scene.primitives.add(tileset);

      // 3. 自动聚焦 camera 到模型位置（恢复场景下 skipZoom 为 true 时跳过）
      if (!options?.skipZoom) {
        this.zoomToTileset(tileset);
      }

      return tileset;
    } catch (error) {
      console.error('加载 3DTiles 失败:', error);
      throw new Error(`加载 3DTiles 模型失败: ${error.message}`);
    }
  }

  /**
   * 添加 GeoJSON DataSource
   * @param {Object|null} geoJson2D - 2D GeoJSON 对象
   * @param {Object|null} geoJson3D - 3D GeoJSON 对象
   * @returns {Promise<{dataSource2D: GeoJsonDataSource|null, dataSource3D: GeoJsonDataSource|null}>}
   */
  async addGeoJsonDataSource(geoJson2D, geoJson3D, geoJsonAnalysis) {
    console.log('addGeoJsonDataSource');
    try {
      const hasActiveTerrain = this.hasActiveTerrain();
      let dataSource2D = null;
      let dataSource3D = null;

      if (geoJson2D && Array.isArray(geoJson2D.features) && geoJson2D.features.length > 0) {
        dataSource2D = await GeoJsonDataSource.load(geoJson2D, {
          clampToGround: hasActiveTerrain
        });
        this.#viewer.dataSources.add(dataSource2D);
      }

      if (geoJson3D && Array.isArray(geoJson3D.features) && geoJson3D.features.length > 0) {
        dataSource3D = await GeoJsonDataSource.load(geoJson3D, {
          clampToGround: false
        });
        this.#viewer.dataSources.add(dataSource3D);
      }

      if (dataSource2D || dataSource3D) {
        await this.zoomToDataSource(
          { dataSource2D, dataSource3D },
          { geoJsonAnalysis }
        );
      }
      return { dataSource2D, dataSource3D };
    } catch (error) {
      console.error('加载 GeoJSON 失败:', error);
      throw new Error(`加载 GeoJSON 失败: ${error.message}`);
    }
  }

  /**
   * 重新加载 GeoJSON 2D DataSource（用于地形切换）
   * @param {{dataSource2D: GeoJsonDataSource|null}} layerInstance - 图层实例
   * @param {Object} geoJson2D - 2D GeoJSON 对象
   * @param {Boolean} clampToGround - 是否贴地形
   * @returns {Promise<GeoJsonDataSource>}
   */
  async reloadGeoJson2D(layerInstance, geoJson2D, clampToGround) {
    if (!layerInstance || !geoJson2D) {
      throw new Error('GeoJSON 2D 数据不存在');
    }
    const wasVisible = layerInstance.dataSource2D?.show ?? true;
    if (layerInstance.dataSource2D) {
      this.#viewer.dataSources.remove(layerInstance.dataSource2D, true);
    }
    const newDataSource = await GeoJsonDataSource.load(geoJson2D, {
      clampToGround
    });
    newDataSource.show = wasVisible;
    this.#viewer.dataSources.add(newDataSource);
    layerInstance.dataSource2D = newDataSource;
    return newDataSource;
  }

  /**
   * 聚焦 camera 到 3DTiles 模型
   * 如果 tileset 尚未加载完成，会等待 readyPromise 后再执行聚焦
   * @param {Object} tileset - Cesium 3DTiles 实例
   * @returns {Promise<void>} 返回 Promise，聚焦完成后 resolve
   */
  zoomToTileset(tileset) {
    if (!tileset) {
      console.error('聚焦失败: tileset 不存在');
      return Promise.reject(new Error('tileset 不存在'));
    }

    // 如果 boundingSphere 已存在，直接聚焦
    if (tileset.boundingSphere) {
      try {
        const boundingSphere = tileset.boundingSphere;
        this.#viewer.camera.flyToBoundingSphere(boundingSphere, {
          duration: 1.0,
          offset: new HeadingPitchRange(
            CesiumMath.toRadians(0),
            CesiumMath.toRadians(-45),
            boundingSphere.radius * 2
          ),
        });
        return Promise.resolve();
      } catch (error) {
        console.error('聚焦失败:', error);
        return Promise.reject(error);
      }
    }

    // 如果 boundingSphere 不存在，等待 tileset 加载完成
    if (tileset.readyPromise) {
      return tileset.readyPromise
        .then(() => {
          if (tileset.boundingSphere) {
            const boundingSphere = tileset.boundingSphere;
            this.#viewer.camera.flyToBoundingSphere(boundingSphere, {
              duration: 1.0,
              offset: new HeadingPitchRange(
                CesiumMath.toRadians(0),
                CesiumMath.toRadians(-45),
                boundingSphere.radius * 2
              ),
            });
          } else {
            console.warn('tileset 加载完成但 boundingSphere 仍不存在');
            return Promise.reject(new Error('tileset boundingSphere 不存在'));
          }
        })
        .catch(error => {
          console.error('等待 tileset 加载失败:', error);
          return Promise.reject(error);
        });
    }

    // 如果既没有 boundingSphere 也没有 readyPromise，返回错误
    console.error('聚焦失败: tileset 未加载且没有 readyPromise');
    return Promise.reject(new Error('tileset 未加载且没有 readyPromise'));
  }

  /**
   * 聚焦 camera 到 DataSource（如 GeoJSON）
   * 支持复合 layerInstance { dataSource2D, dataSource3D }，
   * 会将所有非 null 的 DataSource 的包围球合并后聚焦，保证相机覆盖全部要素范围。
   * 注：viewer.flyTo([ds1, ds2]) 会触发 Cesium 内部 DeveloperError，故改为手动合并包围球后 flyToBoundingSphere。
   * @param {{dataSource2D?: GeoJsonDataSource|null, dataSource3D?: GeoJsonDataSource|null}|GeoJsonDataSource} layerInstance
   * @returns {Promise<void>}
   */
  async zoomToDataSource(layerInstance, options = {}) {
    if (!layerInstance) {
      throw new Error('DataSource 不存在');
    }

    const isComposite = 'dataSource2D' in layerInstance || 'dataSource3D' in layerInstance;
    const targets = isComposite
      ? [layerInstance.dataSource2D, layerInstance.dataSource3D].filter(Boolean)
      : [layerInstance];

    if (targets.length === 0) {
      throw new Error('DataSource 不存在');
    }

    // stats 优先：不依赖 Entity 渲染状态，图层隐藏时仍可定位
    const stats = options?.geoJsonAnalysis?.stats;
    if (stats) {
      const sphere = this.computeBoundingSphereFromStats(stats);
      if (sphere && sphere.radius > 0) {
        await this.#viewer.camera.flyToBoundingSphere(sphere, {
          duration: 2.0,
          offset: new HeadingPitchRange(0, -Math.PI / 4, sphere.radius * 2.5),
        });
        return;
      }
    }

    // 无 stats 时仅单 DataSource 可用 viewer.flyTo（多 DataSource 会触发 Cesium 内部错误）
    /* if (targets.length === 1) {
      await this.#viewer.flyTo(targets[0]);
      return;
    } */

    throw new Error('无法定位：无有效地理范围');
  }

  /**
   * 基于 GeoJSON 分析结果计算包围球
   * @param {{bounds2D: object|null, bounds3D: object|null, heightRange: {min: number, max: number}}} stats
   * @returns {BoundingSphere|null}
   */
  computeBoundingSphereFromStats(stats) {
    const merged = computeMergedBounds(stats);
    if (!merged) {
      return null;
    }

    const rectangle = Rectangle.fromDegrees(
      merged.west,
      merged.south,
      merged.east,
      merged.north
    );
    const ellipsoid = this.#viewer?.scene?.globe?.ellipsoid || Ellipsoid.default;

    const minHeight = Math.min(0, merged.minHeight);
    const maxHeight = Math.max(0, merged.maxHeight);
    if (minHeight === maxHeight) {
      return BoundingSphere.fromRectangle3D(rectangle, ellipsoid, minHeight);
    }

    const sphereMin = BoundingSphere.fromRectangle3D(rectangle, ellipsoid, minHeight);
    const sphereMax = BoundingSphere.fromRectangle3D(rectangle, ellipsoid, maxHeight);
    return BoundingSphere.fromBoundingSpheres([sphereMin, sphereMax]);
  }

  /**
   * 判断当前是否加载了真实地形
   * @returns {Boolean}
   */
  hasActiveTerrain() {
    return !(this.#viewer.scene.globe.terrainProvider instanceof EllipsoidTerrainProvider);
  }

  /**
   * 设置地形提供者
   * @param {import("cesium").TerrainProvider} provider - 地形提供者实例
   * @returns {Boolean} 是否成功设置
   */
  setTerrainProvider(provider) {
    if (!this.#viewer) {
      return false;
    }
    try {
      this.#viewer.scene.globe.terrainProvider = provider;
      return true;
    } catch (error) {
      console.error('设置地形失败:', error);
      return false;
    }
  }

  /**
   * 获取默认地形提供者（椭球体，无高程）
   * @returns {import("cesium").EllipsoidTerrainProvider}
   */
  getDefaultTerrainProvider() {
    return new EllipsoidTerrainProvider();
  }

  /**
   * 移除 3DTiles 模型
   * @param {Object} tileset - Cesium 3DTiles 实例
   * @returns {Boolean} 是否成功移除
   */
  remove3DTilesLayer(tileset) {
    if (tileset) {
      // 清理可视化实体
      this.removeTilesetVisualizations(tileset);
      // 移除 tileset
      const result = this.#viewer.scene.primitives.remove(tileset);
      return result;
    }
    return false;
  }

  /**
   * 从 Cesium 中移除图层（通用方法）
   * @param {Cesium.ImageryLayer|Cesium3DTileset} layerInstance - 图层实例
   * @param {String} layerType - 图层类型 ('service' 或 'model')
   * @returns {Boolean} 是否成功移除
   */
  removeLayerFromCesium(layerInstance, layerType) {
    if (!layerInstance) {
      return false;
    }

    // 根据图层类型选择不同的移除方法
    if (layerType === 'model') {
      // 3DTiles 模型使用 primitives.remove
      return this.remove3DTilesLayer(layerInstance);
    } else if (layerType === 'file') {
      // GeoJSON DataSource 使用 dataSources.remove
      const dataSource2D = layerInstance.dataSource2D || null;
      const dataSource3D = layerInstance.dataSource3D || null;
      if (dataSource2D) {
        this.#viewer.dataSources.remove(dataSource2D, true);
      }
      if (dataSource3D) {
        this.#viewer.dataSources.remove(dataSource3D, true);
      }
      return true;
    } else {
      // ImageryLayer 使用 imageryLayers.remove
      const result = this.#viewer.imageryLayers.remove(layerInstance, true);
      return result;
    }
  }

  /**
   * 设置图层可见性
   * @param {Cesium.ImageryLayer} layerInstance - 图层实例
   * @param {Boolean} visible - 是否可见
   * @returns {Boolean} 是否成功设置
   */
  setLayerVisibility(layerInstance, visible) {
    if (layerInstance) {
      if (layerInstance.dataSource2D || layerInstance.dataSource3D) {
        if (layerInstance.dataSource2D) {
          layerInstance.dataSource2D.show = visible;
        }
        if (layerInstance.dataSource3D) {
          layerInstance.dataSource3D.show = visible;
        }
        return true;
      }
      layerInstance.show = visible;
      return true;
    }
    return false;
  }

  /**
   * 设置图层透明度
   * @param {Cesium.ImageryLayer} layerInstance - 图层实例
   * @param {Number} opacity - 透明度值（0-1）
   * @returns {Boolean} 是否成功设置
   */
  setLayerOpacity(layerInstance, opacity) {
    if (layerInstance) {
      layerInstance.alpha = opacity;
      return true;
    }
    return false;
  }

  /**
   * 设置 3DTiles 瓦片边界体积显示
   * @param {Cesium3DTileset} tileset - 3DTiles 实例
   * @param {Boolean} visible - 是否显示
   * @returns {Boolean} 是否成功设置
   */
  set3DTilesBoundingVolumeVisibility(tileset, visible) {
    if (tileset) {
      tileset.debugShowBoundingVolume = visible;
      return true;
    }
    return false;
  }

  /**
   * 设置 3DTiles 内容边界体积显示
   * @param {Cesium3DTileset} tileset - 3DTiles 实例
   * @param {Boolean} visible - 是否显示
   * @returns {Boolean} 是否成功设置
   */
  set3DTilesContentBoundingVolumeVisibility(tileset, visible) {
    if (tileset) {
      tileset.debugShowContentBoundingVolume = visible;
      return true;
    }
    return false;
  }

  /**
   * 设置 3DTiles 可见性
   * @param {Cesium3DTileset} tileset - 3DTiles 实例
   * @param {Boolean} visible - 是否可见
   * @returns {Boolean} 是否成功设置
   */
  set3DTilesVisibility(tileset, visible) {
    if (!tileset) {
      return false;
    }

    const visualizations = this._getVisualizations(tileset);

    if (visible) {
      // 显示模型：先设置 tileset.show，然后恢复用户期望显示的可视化元素
      tileset.show = true;

      // 恢复包围球
      if (visualizations.userWantsBoundingSphere) {
        this._restoreBoundingSphere(tileset);
      }

      // 恢复包围盒
      if (visualizations.userWantsOrientedBoundingBox) {
        this._restoreOrientedBoundingBox(tileset);
      }

      // 恢复本地坐标轴
      if (visualizations.userWantsLocalAxes) {
        this._restoreLocalAxes(tileset);
      }
    } else {
      // 隐藏模型：先隐藏所有可视化元素，然后隐藏 tileset

      // 隐藏包围球（如果存在）
      if (visualizations.boundingSphere) {
        this.#viewer.entities.remove(visualizations.boundingSphere);
        visualizations.boundingSphere = null;
      }

      // 隐藏包围盒（如果存在）
      visualizations.orientedBoundingBoxes.forEach(entity => {
        this.#viewer.entities.remove(entity);
      });
      visualizations.orientedBoundingBoxes = [];

      // 隐藏本地坐标轴（如果存在）
      visualizations.localAxes.forEach(entity => {
        this.#viewer.entities.remove(entity);
      });
      visualizations.localAxes = [];

      // 最后隐藏 tileset
      tileset.show = false;
    }

    return true;
  }

  /**
   * 获取或创建 tileset 的可视化实体集合
   * @param {Cesium3DTileset} tileset - 3DTiles 实例
   * @returns {Object} 可视化实体集合
   */
  _getVisualizations(tileset) {
    if (!this.#tilesetVisualizations.has(tileset)) {
      this.#tilesetVisualizations.set(tileset, {
        boundingSphere: null,
        orientedBoundingBoxes: [],
        localAxes: [],
        // 记录用户期望显示的状态（独立于 tileset.show）
        userWantsBoundingSphere: false,
        userWantsOrientedBoundingBox: false,
        userWantsLocalAxes: false
      });
    }
    return this.#tilesetVisualizations.get(tileset);
  }

  /**
   * 显示/隐藏包围球
   * @param {Cesium3DTileset} tileset - 3DTiles 实例
   * @param {Boolean} visible - 是否显示
   * @returns {Boolean} 是否成功设置
   */
  showBoundingSphere(tileset, visible) {
    if (!tileset) {
      return false;
    }

    const visualizations = this._getVisualizations(tileset);

    // 记录用户期望状态
    visualizations.userWantsBoundingSphere = visible;

    // 如果 tileset 不可见，不执行实际的显示操作（但允许隐藏操作）
    if (!tileset.show && visible) {
      return true; // 状态已记录，等待 tileset 显示时恢复
    }

    if (visible) {
      // 如果已经存在，先移除
      if (visualizations.boundingSphere) {
        this.#viewer.entities.remove(visualizations.boundingSphere);
      }

      // 等待 tileset 加载完成
      if (!tileset.boundingSphere) {
        // 如果 boundingSphere 还未准备好，等待 readyPromise
        tileset.readyPromise.then(() => {
          this._createBoundingSphere(tileset);
        }).catch(error => {
          console.error('等待 tileset 加载失败:', error);
        });
        return true;
      }

      this._createBoundingSphere(tileset);
    } else {
      // 隐藏：移除实体
      if (visualizations.boundingSphere) {
        this.#viewer.entities.remove(visualizations.boundingSphere);
        visualizations.boundingSphere = null;
      }
    }

    return true;
  }

  /**
   * 创建包围球可视化实体
   * @param {Cesium3DTileset} tileset - 3DTiles 实例
   * @private
   */
  _createBoundingSphere(tileset) {
    if (!tileset.boundingSphere) {
      return;
    }

    const visualizations = this._getVisualizations(tileset);
    const boundingSphere = tileset.boundingSphere;

    const entity = this.#viewer.entities.add({
      position: boundingSphere.center,
      ellipsoid: {
        radii: new Cartesian3(
          boundingSphere.radius,
          boundingSphere.radius,
          boundingSphere.radius
        ),
        material: Color.YELLOW.withAlpha(0.3),
        outline: true,
        outlineColor: Color.YELLOW
      }
    });

    visualizations.boundingSphere = entity;
  }

  /**
   * 恢复包围球显示（内部使用，不更新 userWants 状态）
   * @param {Cesium3DTileset} tileset - 3DTiles 实例
   * @private
   */
  _restoreBoundingSphere(tileset) {
    const visualizations = this._getVisualizations(tileset);

    // 如果已经存在，先移除
    if (visualizations.boundingSphere) {
      this.#viewer.entities.remove(visualizations.boundingSphere);
    }

    // 等待 tileset 加载完成
    if (!tileset.boundingSphere) {
      tileset.readyPromise.then(() => {
        this._createBoundingSphere(tileset);
      }).catch(error => {
        console.error('等待 tileset 加载失败:', error);
      });
      return;
    }

    this._createBoundingSphere(tileset);
  }

  /**
   * 显示/隐藏包围盒
   * @param {Cesium3DTileset} tileset - 3DTiles 实例
   * @param {Boolean} visible - 是否显示
   * @returns {Boolean} 是否成功设置
   */
  showOrientedBoundingBox(tileset, visible) {
    if (!tileset) {
      return false;
    }

    const visualizations = this._getVisualizations(tileset);

    // 记录用户期望状态
    visualizations.userWantsOrientedBoundingBox = visible;

    // 如果 tileset 不可见，不执行实际的显示操作（但允许隐藏操作）
    if (!tileset.show && visible) {
      return true; // 状态已记录，等待 tileset 显示时恢复
    }

    if (visible) {
      // 如果已经存在，先移除
      visualizations.orientedBoundingBoxes.forEach(entity => {
        this.#viewer.entities.remove(entity);
      });
      visualizations.orientedBoundingBoxes = [];

      // 等待 tileset 加载完成
      if (!tileset.root) {
        tileset.readyPromise.then(() => {
          this._createOrientedBoundingBoxes(tileset);
        }).catch(error => {
          console.error('等待 tileset 加载失败:', error);
        });
        return true;
      }

      this._createOrientedBoundingBoxes(tileset);
    } else {
      // 隐藏：移除所有实体
      visualizations.orientedBoundingBoxes.forEach(entity => {
        this.#viewer.entities.remove(entity);
      });
      visualizations.orientedBoundingBoxes = [];
    }

    return true;
  }

  /**
   * 创建包围盒可视化实体
   * 参考：https://www.cnblogs.com/zheyi420/p/18175709
   * @param {Cesium3DTileset} tileset - 3DTiles 实例
   * @private
   */
  _createOrientedBoundingBoxes(tileset) {
    if (!tileset.root) {
      return;
    }

    const visualizations = this._getVisualizations(tileset);
    const entities = [];

    // 获取 TileOrientedBoundingBox 内部的 OrientedBoundingBox
    // tileset.root.boundingVolume 返回 TileOrientedBoundingBox
    // tileset.root.boundingVolume.boundingVolume 返回真正的 OrientedBoundingBox
    const tileOBB = tileset.root.boundingVolume;
    if (!tileOBB || !tileOBB.boundingVolume) {
      console.warn('无法获取 OrientedBoundingBox');
      return;
    }

    const obb = tileOBB.boundingVolume; // 真正的 OrientedBoundingBox
    const center = obb.center;
    const halfAxes = obb.halfAxes; // Matrix3

    // 从 halfAxes 矩阵中提取三个轴向量
    const x = Matrix3.getColumn(halfAxes, 0, new Cartesian3());
    const y = Matrix3.getColumn(halfAxes, 1, new Cartesian3());
    const z = Matrix3.getColumn(halfAxes, 2, new Cartesian3());

    // 计算包围盒尺寸（长、宽、高）
    const length = Cartesian3.magnitude(x) * 2;
    const width = Cartesian3.magnitude(y) * 2;
    const height = Cartesian3.magnitude(z) * 2;

    // 创建包围盒实体（参照博客实现）
    const obbEntity = this.#viewer.entities.add({
      position: center,
      box: {
        dimensions: new Cartesian3(length, width, height),
        material: Color.BLUEVIOLET.withAlpha(0.2),
        outline: true,
        outlineColor: Color.CYAN
      }
    });
    entities.push(obbEntity);

    // 创建八个角点实体（用于验证包围盒位置）
    const corners = this._calculateOBBCorners(center, x, y, z);
    corners.forEach((corner) => {
      // 根据是否为底部角点设置不同的标签位置
      // 顶部角点：标签在上方（verticalOrigin: BOTTOM=1, pixelOffset 向上）
      // 底部角点：标签在下方（verticalOrigin: TOP=-1, pixelOffset 向下）
      const verticalOrigin = corner.isBottom ? VerticalOrigin.TOP : VerticalOrigin.BOTTOM;
      const pixelOffsetY = corner.isBottom ? 20 : -20;  // 向下 : 向上

      const cornerEntity = this.#viewer.entities.add({
        position: corner.position,
        point: {
          color: Color.RED,
          pixelSize: 10
        },
        label: {
          text: corner.label,
          font: '28px sans-serif',
          style: LabelStyle.FILL_AND_OUTLINE,
          fillColor: Color.BLUE,
          outlineColor: Color.WHITE,
          outlineWidth: 2,
          horizontalOrigin: HorizontalOrigin.CENTER,
          verticalOrigin: verticalOrigin,
          pixelOffset: new Cartesian2(0, pixelOffsetY)
        }
      });
      entities.push(cornerEntity);
    });

    visualizations.orientedBoundingBoxes = entities;
  }

  /**
   * 恢复包围盒显示（内部使用，不更新 userWants 状态）
   * @param {Cesium3DTileset} tileset - 3DTiles 实例
   * @private
   */
  _restoreOrientedBoundingBox(tileset) {
    const visualizations = this._getVisualizations(tileset);

    // 如果已经存在，先移除
    visualizations.orientedBoundingBoxes.forEach(entity => {
      this.#viewer.entities.remove(entity);
    });
    visualizations.orientedBoundingBoxes = [];

    // 等待 tileset 加载完成
    if (!tileset.root) {
      tileset.readyPromise.then(() => {
        this._createOrientedBoundingBoxes(tileset);
      }).catch(error => {
        console.error('等待 tileset 加载失败:', error);
      });
      return;
    }

    this._createOrientedBoundingBoxes(tileset);
  }

  /**
   * 计算 OBB 的八个角点
   * 参考：https://www.cnblogs.com/zheyi420/p/18175709
   * @param {Cartesian3} center - OBB 中心点
   * @param {Cartesian3} x - X轴向量
   * @param {Cartesian3} y - Y轴向量
   * @param {Cartesian3} z - Z轴向量
   * @returns {Array} 八个角点的数组
   * @private
   */
  _calculateOBBCorners(center, x, y, z) {
    const corners = [];

    // 八个角点的符号组合
    // 顶面四个点（+z）- isBottom: false
    corners.push({ label: '1', signs: ['-', '-', '+'], isBottom: false }); // -x, -y, +z
    corners.push({ label: '2', signs: ['+', '-', '+'], isBottom: false }); // +x, -y, +z
    corners.push({ label: '3', signs: ['+', '+', '+'], isBottom: false }); // +x, +y, +z
    corners.push({ label: '4', signs: ['-', '+', '+'], isBottom: false }); // -x, +y, +z
    // 底面四个点（-z）- isBottom: true
    corners.push({ label: '5', signs: ['-', '-', '-'], isBottom: true }); // -x, -y, -z
    corners.push({ label: '6', signs: ['+', '-', '-'], isBottom: true }); // +x, -y, -z
    corners.push({ label: '7', signs: ['+', '+', '-'], isBottom: true }); // +x, +y, -z
    corners.push({ label: '8', signs: ['-', '+', '-'], isBottom: true }); // -x, +y, -z

    return corners.map(corner => {
      let position = Cartesian3.clone(center);

      // 根据符号添加或减去对应的轴向量
      if (corner.signs[0] === '+') {
        position = Cartesian3.add(position, x, position);
      } else {
        position = Cartesian3.subtract(position, x, position);
      }

      if (corner.signs[1] === '+') {
        position = Cartesian3.add(position, y, position);
      } else {
        position = Cartesian3.subtract(position, y, position);
      }

      if (corner.signs[2] === '+') {
        position = Cartesian3.add(position, z, position);
      } else {
        position = Cartesian3.subtract(position, z, position);
      }

      return {
        label: corner.label,
        position: position,
        isBottom: corner.isBottom
      };
    });
  }

  /**
   * 计算从 Z 轴方向到目标方向的旋转四元数
   * @param {Cartesian3} targetDirection - 目标方向向量
   * @returns {Quaternion} 旋转四元数
   * @private
   */
  _computeAxisOrientation(targetDirection) {
    const zAxis = Cartesian3.UNIT_Z;
    const normalizedTarget = Cartesian3.normalize(targetDirection, new Cartesian3());

    // 如果方向相同，返回单位四元数
    if (Cartesian3.equalsEpsilon(normalizedTarget, zAxis, CesiumMath.EPSILON10)) {
      return Quaternion.IDENTITY;
    }

    // 如果方向相反，需要180度旋转
    const negatedZ = Cartesian3.negate(zAxis, new Cartesian3());
    if (Cartesian3.equalsEpsilon(normalizedTarget, negatedZ, CesiumMath.EPSILON10)) {
      return Quaternion.fromAxisAngle(Cartesian3.UNIT_X, CesiumMath.PI);
    }

    // 计算旋转轴（垂直于两个向量的平面）
    const rotationAxis = Cartesian3.cross(zAxis, normalizedTarget, new Cartesian3());
    const axisLength = Cartesian3.magnitude(rotationAxis);

    // 如果两个向量平行，使用 X 轴作为旋转轴
    if (axisLength < CesiumMath.EPSILON10) {
      return Quaternion.fromAxisAngle(Cartesian3.UNIT_X, CesiumMath.PI);
    }

    // 归一化旋转轴
    Cartesian3.normalize(rotationAxis, rotationAxis);

    // 计算旋转角度
    const dot = Cartesian3.dot(zAxis, normalizedTarget);
    const angle = Math.acos(CesiumMath.clamp(dot, -1.0, 1.0));

    // 创建四元数
    return Quaternion.fromAxisAngle(rotationAxis, angle);
  }

  /**
   * 显示/隐藏本地坐标轴
   * @param {Cesium3DTileset} tileset - 3DTiles 实例
   * @param {Boolean} visible - 是否显示
   * @returns {Boolean} 是否成功设置
   */
  showLocalAxes(tileset, visible) {
    if (!tileset) {
      return false;
    }

    const visualizations = this._getVisualizations(tileset);

    // 记录用户期望状态
    visualizations.userWantsLocalAxes = visible;

    // 如果 tileset 不可见，不执行实际的显示操作（但允许隐藏操作）
    if (!tileset.show && visible) {
      return true; // 状态已记录，等待 tileset 显示时恢复
    }

    if (visible) {
      // 如果已经存在，先移除
      visualizations.localAxes.forEach(entity => {
        this.#viewer.entities.remove(entity);
      });
      visualizations.localAxes = [];

      // 等待 tileset 加载完成
      if (!tileset.boundingSphere) {
        tileset.readyPromise.then(() => {
          this._createLocalAxes(tileset);
        }).catch(error => {
          console.error('等待 tileset 加载失败:', error);
        });
        return true;
      }

      this._createLocalAxes(tileset);
    } else {
      // 隐藏：移除所有实体
      visualizations.localAxes.forEach(entity => {
        this.#viewer.entities.remove(entity);
      });
      visualizations.localAxes = [];
    }

    return true;
  }

  /**
   * 创建本地坐标轴可视化实体
   * 参考：https://www.cnblogs.com/zheyi420/p/18175709
   * @param {Cesium3DTileset} tileset - 3DTiles 实例
   * @private
   */
  _createLocalAxes(tileset) {
    if (!tileset.root) {
      return;
    }

    const visualizations = this._getVisualizations(tileset);

    // 获取 TileOrientedBoundingBox 内部的 OrientedBoundingBox
    const tileOBB = tileset.root.boundingVolume;
    if (!tileOBB || !tileOBB.boundingVolume) {
      console.warn('无法获取 OrientedBoundingBox，使用默认坐标轴');
      return;
    }

    const obb = tileOBB.boundingVolume; // 真正的 OrientedBoundingBox
    const center = obb.center;
    const halfAxes = obb.halfAxes; // Matrix3

    // 从 halfAxes 矩阵中提取三个轴向量（本地坐标轴方向）
    const x = Matrix3.getColumn(halfAxes, 0, new Cartesian3());
    const y = Matrix3.getColumn(halfAxes, 1, new Cartesian3());
    const z = Matrix3.getColumn(halfAxes, 2, new Cartesian3());

    // 计算包围盒的完整尺寸（halfAxes 是半轴，需要乘以2）
    const xLength = Cartesian3.magnitude(x) * 2;
    const yLength = Cartesian3.magnitude(y) * 2;
    const zLength = Cartesian3.magnitude(z) * 2;

    // 计算三个轴长度的最大值，统一使用最长轴的长度
    const maxLength = Math.max(xLength, yLength, zLength);

    // 计算包围盒体积
    const volume = xLength * yLength * zLength;

    // 基于体积计算统一的锥体基准尺寸（使用几何平均长度）
    // 几何平均 = (xLength * yLength * zLength)^(1/3) = volume^(1/3)
    const geometricMean = Math.pow(volume, 1/3);

    // 计算统一的锥体大小（使用几何平均的 3%，确保在查看整个模型时仍能清晰可见）
    const coneBaseSize = geometricMean * 0.03;
    const coneLength = coneBaseSize * 3;
    const coneBottomRadius = coneBaseSize; // 底半径与长度一致

    const scale = 1.4;
    // 统一使用最长轴的长度，计算 scale 倍长度的轴端点（用于绘制轴线段）
    const maxAxisLength = maxLength / 2; // 转换为半轴长度
    const scaledLength = maxAxisLength * scale; // 统一的缩放后长度

    const normalizedX = Cartesian3.normalize(x, new Cartesian3());
    const normalizedY = Cartesian3.normalize(y, new Cartesian3());
    const normalizedZ = Cartesian3.normalize(z, new Cartesian3());

    // 使用统一的长度计算三个轴的端点
    const scaledX = Cartesian3.multiplyByScalar(normalizedX, scaledLength, new Cartesian3());
    const scaledY = Cartesian3.multiplyByScalar(normalizedY, scaledLength, new Cartesian3());
    const scaledZ = Cartesian3.multiplyByScalar(normalizedZ, scaledLength, new Cartesian3());

    const xAxisEnd = Cartesian3.add(center, scaledX, new Cartesian3());
    const yAxisEnd = Cartesian3.add(center, scaledY, new Cartesian3());
    const zAxisEnd = Cartesian3.add(center, scaledZ, new Cartesian3());

    // X轴线段（红色）
    const xAxisEntity = this.#viewer.entities.add({
      polyline: {
        positions: [center, xAxisEnd],
        width: 4,
        material: Color.RED
      }
    });

    // X轴端点锥体（红色）- 使用统一的锥体大小
    const xAxisOrientation = this._computeAxisOrientation(normalizedX);
    const xConeEntity = this.#viewer.entities.add({
      position: xAxisEnd,
      orientation: xAxisOrientation,
      cylinder: {
        length: coneLength,
        topRadius: 0,
        bottomRadius: coneBottomRadius, // 统一的底部半径
        material: Color.RED,
        outline: true,
        outlineColor: Color.RED
      }
    });

    // Y轴线段（绿色）
    const yAxisEntity = this.#viewer.entities.add({
      polyline: {
        positions: [center, yAxisEnd],
        width: 4,
        material: Color.GREEN
      }
    });

    // Y轴端点锥体（绿色）- 使用统一的锥体大小
    const yAxisOrientation = this._computeAxisOrientation(normalizedY);
    const yConeEntity = this.#viewer.entities.add({
      position: yAxisEnd,
      orientation: yAxisOrientation,
      cylinder: {
        length: coneLength,
        topRadius: 0,
        bottomRadius: coneBottomRadius, // 统一的底部半径
        material: Color.GREEN,
        outline: true,
        outlineColor: Color.GREEN
      }
    });

    // Z轴线段（蓝色）
    const zAxisEntity = this.#viewer.entities.add({
      polyline: {
        positions: [center, zAxisEnd],
        width: 4,
        material: Color.BLUE
      }
    });

    // Z轴端点锥体（蓝色）- 使用统一的锥体大小
    const zAxisOrientation = this._computeAxisOrientation(normalizedZ);
    const zConeEntity = this.#viewer.entities.add({
      position: zAxisEnd,
      orientation: zAxisOrientation,
      cylinder: {
        length: coneLength,
        topRadius: 0,
        bottomRadius: coneBottomRadius, // 统一的底部半径
        material: Color.BLUE,
        outline: true,
        outlineColor: Color.BLUE
      }
    });

    // 计算标签位置：从锥体位置沿着轴方向再延伸 coneLength 的距离
    const labelOffsetX = Cartesian3.multiplyByScalar(normalizedX, coneLength, new Cartesian3());
    const labelOffsetY = Cartesian3.multiplyByScalar(normalizedY, coneLength, new Cartesian3());
    const labelOffsetZ = Cartesian3.multiplyByScalar(normalizedZ, coneLength, new Cartesian3());

    const xLabelPosition = Cartesian3.add(xAxisEnd, labelOffsetX, new Cartesian3());
    const yLabelPosition = Cartesian3.add(yAxisEnd, labelOffsetY, new Cartesian3());
    const zLabelPosition = Cartesian3.add(zAxisEnd, labelOffsetZ, new Cartesian3());

    // 创建X轴标签
    const xLabelEntity = this.#viewer.entities.add({
      position: xLabelPosition,
      label: {
        text: 'X',
        font: '28px sans-serif',
        style: LabelStyle.FILL_AND_OUTLINE,
        fillColor: Color.RED,
        outlineColor: Color.WHITE,
        outlineWidth: 2,
        horizontalOrigin: HorizontalOrigin.CENTER,
        verticalOrigin: VerticalOrigin.CENTER,
        pixelOffset: new Cartesian2(0, 0)
      }
    });

    // 创建Y轴标签
    const yLabelEntity = this.#viewer.entities.add({
      position: yLabelPosition,
      label: {
        text: 'Y',
        font: '28px sans-serif',
        style: LabelStyle.FILL_AND_OUTLINE,
        fillColor: Color.GREEN,
        outlineColor: Color.WHITE,
        outlineWidth: 2,
        horizontalOrigin: HorizontalOrigin.CENTER,
        verticalOrigin: VerticalOrigin.CENTER,
        pixelOffset: new Cartesian2(0, 0)
      }
    });

    // 创建Z轴标签
    const zLabelEntity = this.#viewer.entities.add({
      position: zLabelPosition,
      label: {
        text: 'Z',
        font: '28px sans-serif',
        style: LabelStyle.FILL_AND_OUTLINE,
        fillColor: Color.BLUE,
        outlineColor: Color.WHITE,
        outlineWidth: 2,
        horizontalOrigin: HorizontalOrigin.CENTER,
        verticalOrigin: VerticalOrigin.CENTER,
        pixelOffset: new Cartesian2(0, 0)
      }
    });

    visualizations.localAxes = [
      xAxisEntity, xConeEntity, xLabelEntity,
      yAxisEntity, yConeEntity, yLabelEntity,
      zAxisEntity, zConeEntity, zLabelEntity
    ];
  }

  /**
   * 恢复本地坐标轴显示（内部使用，不更新 userWants 状态）
   * @param {Cesium3DTileset} tileset - 3DTiles 实例
   * @private
   */
  _restoreLocalAxes(tileset) {
    const visualizations = this._getVisualizations(tileset);

    // 如果已经存在，先移除
    visualizations.localAxes.forEach(entity => {
      this.#viewer.entities.remove(entity);
    });
    visualizations.localAxes = [];

    // 等待 tileset 加载完成
    if (!tileset.boundingSphere) {
      tileset.readyPromise.then(() => {
        this._createLocalAxes(tileset);
      }).catch(error => {
        console.error('等待 tileset 加载失败:', error);
      });
      return;
    }

    this._createLocalAxes(tileset);
  }

  /**
   * 设置 3DTiles 透明度
   * @param {Cesium3DTileset} tileset - 3DTiles 实例
   * @param {Number} opacity - 透明度值（0-1）
   * @returns {Boolean} 是否成功设置
   */
  set3DTilesOpacity(tileset, opacity) {
    if (!tileset) {
      return false;
    }

    try {
      // 使用 Cesium3DTileStyle 设置透明度
      // color("white", opacity) 保持原始纹理颜色，只调整透明度
      tileset.style = new Cesium3DTileStyle({
        color: `color("white", ${opacity})`
      });
      
      // 设置颜色混合模式为 HIGHLIGHT
      // 这样样式颜色会与原始颜色相乘，保持纹理细节
      tileset.colorBlendMode = Cesium3DTileColorBlendMode.HIGHLIGHT;
      
      return true;
    } catch (error) {
      console.error('设置 3DTiles 透明度失败:', error);
      return false;
    }
  }

  /**
   * 清理 tileset 的所有可视化实体
   * @param {Cesium3DTileset} tileset - 3DTiles 实例
   */
  removeTilesetVisualizations(tileset) {
    if (!tileset) {
      return;
    }

    const visualizations = this.#tilesetVisualizations.get(tileset);
    if (!visualizations) {
      return;
    }

    // 移除包围球
    if (visualizations.boundingSphere) {
      this.#viewer.entities.remove(visualizations.boundingSphere);
    }

    // 移除所有包围盒
    visualizations.orientedBoundingBoxes.forEach(entity => {
      this.#viewer.entities.remove(entity);
    });

    // 移除所有坐标轴
    visualizations.localAxes.forEach(entity => {
      this.#viewer.entities.remove(entity);
    });

    // 从 WeakMap 中移除（WeakMap 会自动处理）
    this.#tilesetVisualizations.delete(tileset);
  }

  /**
   * 获取viewer实例（用于其他需要direct access的场景）
   * @returns {Cesium.Viewer} viewer实例
   */
  getViewer() {
    return this.#viewer;
  }

  /**
   * 重置单例实例（主要用于测试或重新初始化）
   */
  static resetInstance() {
    LayerManager.#instance = null;
  }
}

export default LayerManager;
