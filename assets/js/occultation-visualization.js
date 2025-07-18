const eventFile = '/assets/data/occultation_events.json';
const statusDiv = document.getElementById('status');

// 设置Cesium Ion访问令牌（使用默认令牌）
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWE1OWUxNy1mMWZiLTQzYjYtYTQ0OS1kMWFjYmFkNjc5YzciLCJpZCI6NTc3MzMsImlhdCI6MTYyMjg0NjQ5NH0.XcKpgANiY19MC4bdFUXMVEBToBmqS8kuYpUlxJHYZxY';

function getColor(type) {
    if (type === 'iono') return Cesium.Color.CYAN;
    if (type === 'atm') return Cesium.Color.ORANGE;
    return Cesium.Color.GRAY;
}

function showStatus(message) {
    statusDiv.innerHTML = message;
    console.log(message);
}

// 检查Cesium是否可用
function checkCesium() {
    showStatus('检查Cesium库...');
    
    if (typeof Cesium === 'undefined') {
        showStatus('错误：Cesium 库未正确加载');
        return false;
    }
    
    console.log('Cesium版本:', Cesium.VERSION);
    console.log('Cesium对象:', Cesium);
    
    showStatus('Cesium库已加载，正在初始化地球...');
    return true;
}

// 检查DOM元素
function checkDOM() {
    const container = document.getElementById('cesiumContainer');
    if (!container) {
        showStatus('错误：找不到 #cesiumContainer 元素');
        return false;
    }
    
    const statusDiv = document.getElementById('status');
    if (!statusDiv) {
        showStatus('错误：找不到 #status 元素');
        return false;
    }
    
    return true;
}

// 初始化Cesium地球
function initCesiumViewer() {
    console.log('初始化Cesium Viewer...');
    
    // 创建Cesium Viewer - 使用简化配置避免兼容性问题
    const viewer = new Cesium.Viewer('cesiumContainer', {
        baseLayerPicker: true, // 图层选择器
        geocoder: true, // 地理编码器
        homeButton: true, // 主页按钮
        sceneModePicker: true, // 场景模式选择器
        navigationHelpButton: true, // 导航帮助按钮
        animation: false, // 动画控件
        timeline: false, // 时间轴
        fullscreenButton: true, // 全屏按钮
        infoBox: true, // 信息框
        selectionIndicator: true, // 选择指示器
        shadows: false, // 关闭阴影避免兼容性问题
        shouldAnimate: true, // 动画
        requestRenderMode: true, // 请求渲染模式
        maximumRenderTimeChange: Infinity, // 最大渲染时间变化
        targetFrameRate: 60 // 目标帧率
    });
    
    // 确保地球图层正确加载
    const imageryLayers = viewer.scene.globe.imageryLayers;
    if (imageryLayers.length === 0) {
        // 如果没有图层，添加默认的Bing Maps图层
        imageryLayers.addImageryProvider(new Cesium.BingMapsImageryProvider({
            url: 'https://dev.virtualearth.net',
            key: 'AuGz4Kzoq3JIIx7hdNh1u65d0u0fxXtTMdUrvBxCEZRO3z9EnOW5m8rp5nKvAecJ',
            mapStyle: Cesium.BingMapsStyle.AERIAL_WITH_LABELS
        }));
    }
    
    // 配置场景
    const scene = viewer.scene;
    scene.globe.enableLighting = true; // 启用光照
    scene.globe.atmosphereLighting = true; // 大气光照
    scene.globe.atmosphereLightingIntensity = 5.0; // 大气光照强度
    scene.globe.atmosphereHueShift = 0.1; // 大气色调偏移
    scene.globe.atmosphereSaturationShift = 0.1; // 大气饱和度偏移
    scene.globe.atmosphereBrightnessShift = 1.0; // 大气亮度偏移
    
    // 设置相机初始位置
    viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000), // 从赤道上方看地球
        orientation: {
            heading: 0.0,
            pitch: -Cesium.Math.PI_OVER_TWO,
            roll: 0.0
        }
    });
    
    // 启用深度测试
    scene.globe.depthTestAgainstTerrain = true;
    
    return viewer;
}

// 添加掩星轨迹到Cesium
function addOccultationTrajectories(viewer, data) {
    console.log('添加掩星轨迹到Cesium...');
    
    // const testData = data.slice(0, 10); // 显示前10个事件
    const testData = data; // 显示所有事件
    let validEvents = 0;
    
    testData.forEach((event, index) => {
        if (!event.points || event.points.length < 2) {
            console.log(`事件 ${index} 点数不足:`, event.points?.length);
            return;
        }
        
        // 创建轨迹点数组
        const positions = event.points.map(p => {
            const lon = parseFloat(p.lon) || 0;
            const lat = parseFloat(p.lat) || 0;
            const alt = parseFloat(p.alt) || 0;
            
            // 转换为Cesium坐标（高度单位为米）
            return Cesium.Cartesian3.fromDegrees(lon, lat, alt * 1000);
        });
        
        console.log(`事件 ${index} (${event.type}): ${positions.length} 个点`);
        
        // 添加轨迹线
        viewer.entities.add({
            name: `${event.type} 掩星轨迹 ${index + 1}`,
            polyline: {
                positions: positions,
                width: 3,
                material: getColor(event.type),
                clampToGround: false,
                zIndex: 1000
            }
        });
        
        // 添加起点标记
        if (positions.length > 0) {
            viewer.entities.add({
                name: `起点 ${index + 1}`,
                position: positions[0],
                point: {
                    pixelSize: 8,
                    color: getColor(event.type),
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.NONE
                },
                label: {
                    text: `S${index + 1}`,
                    font: '12pt sans-serif',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    pixelOffset: new Cesium.Cartesian2(0, -20),
                    heightReference: Cesium.HeightReference.NONE
                }
            });
            
            // 添加终点标记
            viewer.entities.add({
                name: `终点 ${index + 1}`,
                position: positions[positions.length - 1],
                point: {
                    pixelSize: 8,
                    color: getColor(event.type),
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.NONE
                },
                label: {
                    text: `E${index + 1}`,
                    font: '12pt sans-serif',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    pixelOffset: new Cesium.Cartesian2(0, -20),
                    heightReference: Cesium.HeightReference.NONE
                }
            });
        }
        
        validEvents++;
    });
    
    return validEvents;
}

// 添加图例
function addLegend(viewer, validEvents) {
    const legend = document.createElement('div');
    legend.style.position = 'absolute';
    legend.style.top = '10px';
    legend.style.right = '10px';
    legend.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    legend.style.color = 'white';
    legend.style.padding = '10px';
    legend.style.borderRadius = '5px';
    legend.style.fontSize = '12px';
    legend.style.fontFamily = 'Arial, sans-serif';
    legend.style.zIndex = '1000';
    
    legend.innerHTML = `
        <div style="margin-bottom: 5px;"><strong>掩星轨迹图例</strong></div>
        <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 20px; height: 3px; background-color: cyan; margin-right: 5px;"></div>
            <span>电离层掩星 (${validEvents}条)</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 3px;">
            <div style="width: 20px; height: 3px; background-color: orange; margin-right: 5px;"></div>
            <span>大气掩星</span>
        </div>
        <div style="font-size: 10px; margin-top: 5px; opacity: 0.8;">
            操作: 鼠标拖拽旋转 | 滚轮缩放 | 双击定位
        </div>
    `;
    
    document.getElementById('cesiumContainer').appendChild(legend);
}

// 主函数
function initVisualization() {
    console.log('开始初始化Cesium可视化...');
    
    if (!checkDOM()) {
        console.log('DOM检查失败');
        return;
    }
    
    if (!checkCesium()) {
        console.log('Cesium检查失败');
        return;
    }
    
    try {
        // 初始化Cesium Viewer
        const viewer = initCesiumViewer();
        console.log('Cesium Viewer初始化成功');
        
        // 加载数据
        loadDataForCesium(viewer);
        
    } catch (error) {
        showStatus(`Cesium初始化失败: ${error.message}`);
        console.error('Cesium初始化错误:', error);
    }
}

function loadDataForCesium(viewer) {
    console.log('开始加载数据用于Cesium...');
    
    // 使用fetch API加载数据
    fetch(eventFile)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Cesium数据加载成功:', data.length, '个事件');
            showStatus(`数据加载成功，共 ${data.length} 个事件`);
            
            const validEvents = addOccultationTrajectories(viewer, data);
            addLegend(viewer, validEvents);
            
            showStatus(`Cesium渲染完成！显示 ${validEvents} 条轨迹。支持鼠标拖拽、滚轮缩放、双击定位。`);
        })
        .catch(error => {
            console.error('Cesium数据加载失败:', error);
            showStatus(`数据加载失败: ${error.message}`);
        });
}

// 等待DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVisualization);
} else {
    initVisualization();
} 