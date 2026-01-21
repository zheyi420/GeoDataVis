/*
 * @Description: 图层管理器（单例模式）
 * LayerManager 专注于 Cesium 操作，不管理 store 状态
 */

import { createWmsImageryLayer, createWmtsImageryLayer, create3DTilesLayer } from './utils/ImageryLayerUtils';
import { HeadingPitchRange, Math as CesiumMath, Color, Cartesian3, Cesium3DTileStyle, Cesium3DTileColorBlendMode, Matrix3 } from 'cesium';

class LayerManager {
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
    return createWmsImageryLayer(wmsOptions)
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
   * @returns {Promise<Object>} 返回 tileset 实例的 Promise
   */
  async add3DTilesLayer(tilesOptions) {
    console.log('add3DTilesLayer', tilesOptions);
    try {
      // 1. 使用工具函数创建 3DTiles 模型
      const tileset = await create3DTilesLayer(tilesOptions);

      // 2. 添加到 Cesium viewer 的 primitives
      this.#viewer.scene.primitives.add(tileset);

      // 3. 自动聚焦 camera 到模型位置
      this._zoomToTileset(tileset);

      return tileset;
    } catch (error) {
      console.error('加载 3DTiles 失败:', error);
      throw new Error(`加载 3DTiles 模型失败: ${error.message}`);
    }
  }

  /**
   * 聚焦 camera 到 3DTiles 模型
   * @param {Object} tileset - Cesium 3DTiles 实例
   */
  _zoomToTileset(tileset) {
    try {
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
      }
    } catch (error) {
      console.error('聚焦失败:', error);
    }
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
    if (tileset) {
      tileset.show = visible;
      return true;
    }
    return false;
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
        localAxes: []
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
      const cornerEntity = this.#viewer.entities.add({
        position: corner.position,
        point: {
          color: Color.RED,
          pixelSize: 10
        },
        label: {
          text: corner.label,
          font: '20px sans-serif',
          style: 2, // FILL_AND_OUTLINE
          fillColor: Color.BLUE,
          outlineColor: Color.WHITE,
          outlineWidth: 2,
          horizontalOrigin: 0, // CENTER
          verticalOrigin: 2, // BASELINE
          pixelOffset: new Cartesian3(0, -20, 0)
        }
      });
      entities.push(cornerEntity);
    });

    visualizations.orientedBoundingBoxes = entities;
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
    // 顶面四个点（+z）
    corners.push({ label: '1', signs: ['-', '-', '+'] }); // -x, -y, +z
    corners.push({ label: '2', signs: ['+', '-', '+'] }); // +x, -y, +z
    corners.push({ label: '3', signs: ['+', '+', '+'] }); // +x, +y, +z
    corners.push({ label: '4', signs: ['-', '+', '+'] }); // -x, +y, +z
    // 底面四个点（-z）
    corners.push({ label: '5', signs: ['-', '-', '-'] }); // -x, -y, -z
    corners.push({ label: '6', signs: ['+', '-', '-'] }); // +x, -y, -z
    corners.push({ label: '7', signs: ['+', '+', '-'] }); // +x, +y, -z
    corners.push({ label: '8', signs: ['-', '+', '-'] }); // -x, +y, -z

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
        position: position
      };
    });
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

    // 计算坐标轴端点：center + 轴向量
    const xAxisEnd = Cartesian3.add(center, x, new Cartesian3());
    const yAxisEnd = Cartesian3.add(center, y, new Cartesian3());
    const zAxisEnd = Cartesian3.add(center, z, new Cartesian3());

    // X轴（红色）
    const xAxisEntity = this.#viewer.entities.add({
      polyline: {
        positions: [center, xAxisEnd],
        width: 4,
        material: Color.RED
      }
    });

    // Y轴（绿色）
    const yAxisEntity = this.#viewer.entities.add({
      polyline: {
        positions: [center, yAxisEnd],
        width: 4,
        material: Color.GREEN
      }
    });

    // Z轴（蓝色）
    const zAxisEntity = this.#viewer.entities.add({
      polyline: {
        positions: [center, zAxisEnd],
        width: 4,
        material: Color.BLUE
      }
    });

    visualizations.localAxes = [xAxisEntity, yAxisEntity, zAxisEntity];
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
      // 方法1：使用 style（推荐）
      if (tileset.style !== undefined) {
        tileset.style = new Cesium3DTileStyle({
          color: `color("white", ${opacity})`
        });
        return true;
      }

      // 方法2：使用 colorBlendMode（备用方案）
      tileset.colorBlendMode = Cesium3DTileColorBlendMode.MIX;
      tileset.color = Color.WHITE.withAlpha(opacity);
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
