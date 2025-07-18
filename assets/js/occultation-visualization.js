const eventFile = '/assets/data/occultation_events.json';
const statusDiv = document.getElementById('status');

// 设置Cesium Ion访问令牌 - 使用空令牌避免认证问题
Cesium.Ion.defaultAccessToken = '';

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
    
    // 创建Cesium Viewer - 使用最简配置确保地球显示
    const viewer = new Cesium.Viewer('cesiumContainer', {
        baseLayerPicker: false, // 暂时关闭图层选择器
        geocoder: false, // 暂时关闭地理编码器
        homeButton: false, // 暂时关闭主页按钮
        sceneModePicker: false, // 暂时关闭场景模式选择器
        navigationHelpButton: false, // 暂时关闭导航帮助按钮
        animation: false, // 动画控件
        timeline: false, // 时间轴
        fullscreenButton: false, // 暂时关闭全屏按钮
        infoBox: false, // 暂时关闭信息框
        selectionIndicator: false, // 暂时关闭选择指示器
        shadows: false, // 关闭阴影
        shouldAnimate: true, // 动画
        requestRenderMode: false, // 关闭请求渲染模式
        targetFrameRate: 60 // 目标帧率
    });
    
    // 尝试添加真实地球纹理
    try {
        // 移除所有默认图层
        viewer.scene.globe.imageryLayers.removeAll();
        console.log('已移除所有默认图层');
        
        // 方案1：使用OpenStreetMap（免费，无需API密钥）
        const osmProvider = new Cesium.OpenStreetMapImageryProvider({
            url: 'https://a.tile.openstreetmap.org/'
        });
        
        viewer.scene.globe.imageryLayers.addImageryProvider(osmProvider);
        console.log('OpenStreetMap真实地球纹理添加成功');
        
    } catch (error) {
        console.error('OpenStreetMap添加失败:', error);
        
        // 方案2：尝试使用CartoDB
        try {
            const cartoProvider = new Cesium.CartoDBImageryProvider({
                map: 'light_all'
            });
            viewer.scene.globe.imageryLayers.addImageryProvider(cartoProvider);
            console.log('CartoDB真实地球纹理添加成功');
        } catch (cartoError) {
            console.error('CartoDB也失败:', cartoError);
            
            // 方案3：使用默认的Cesium World Imagery
            try {
                const worldImagery = Cesium.createWorldImagery();
                viewer.scene.globe.imageryLayers.addImageryProvider(worldImagery);
                console.log('Cesium World Imagery真实地球纹理添加成功');
            } catch (worldError) {
                console.error('所有真实纹理都失败，使用颜色地球:', worldError);
                
                // 最后方案：创建蓝色地球材质
                const earthMaterial = Cesium.Material.fromType('Color', {
                    color: new Cesium.Color(0.2, 0.5, 0.8, 1.0) // 蓝色地球
                });
                viewer.scene.globe.material = earthMaterial;
                console.log('使用蓝色地球作为备选方案');
            }
        }
    }
    
    // 配置场景
    const scene = viewer.scene;
    scene.globe.enableLighting = false; // 暂时关闭光照
    scene.globe.atmosphereLighting = false; // 暂时关闭大气光照
    
    // 设置相机初始位置
    viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000), // 从赤道上方看地球
        orientation: {
            heading: 0.0,
            pitch: -Cesium.Math.PI_OVER_TWO,
            roll: 0.0
        }
    });
    
    // 强制渲染
    scene.requestRender();
    
    console.log('Cesium Viewer初始化完成');
    return viewer;
}

// 添加掩星轨迹到Cesium
function addOccultationTrajectories(viewer, data) {
    console.log('添加掩星轨迹到Cesium...');
    
    const testData = data.slice(0, 100); // 显示前10个事件
    //const testData = data; // 显示所有事件
    let validEvents = 0;
    let ionoCount = 0;
    let atmCount = 0;
    
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
        
        // 根据类型选择颜色和材质
        let lineColor, lineMaterial;
        if (event.type === 'iono') {
            lineColor = Cesium.Color.CYAN;
            lineMaterial = Cesium.Color.CYAN.withAlpha(0.8);
            ionoCount++;
        } else if (event.type === 'atm') {
            lineColor = Cesium.Color.ORANGE;
            lineMaterial = Cesium.Color.ORANGE.withAlpha(0.8);
            atmCount++;
        } else {
            lineColor = Cesium.Color.GRAY;
            lineMaterial = Cesium.Color.GRAY.withAlpha(0.8);
        }
        
        // 添加轨迹线
        const polyline = viewer.entities.add({
            name: `${event.type} 掩星轨迹 ${index + 1}`,
            polyline: {
                positions: positions,
                width: 2,
                material: lineMaterial,
                clampToGround: false,
                zIndex: 1000
            }
        });
        
        // 添加起点标记和标签
        const startPoint = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(positions[0].x, positions[0].y, positions[0].z),
            point: {
                pixelSize: 6,
                color: lineColor,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 1,
                heightReference: Cesium.HeightReference.NONE
            },
            label: {
                text: `${event.type === 'iono' ? 'I' : 'A'}${index + 1}`,
                font: '10pt sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 1,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, -15),
                heightReference: Cesium.HeightReference.NONE,
                show: false // 默认隐藏标签
            }
        });
        
        // 添加终点标记和标签
        const endPoint = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(positions[positions.length - 1].x, positions[positions.length - 1].y, positions[positions.length - 1].z),
            point: {
                pixelSize: 6,
                color: lineColor,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 1,
                heightReference: Cesium.HeightReference.NONE
            },
            label: {
                text: `${event.type === 'iono' ? 'I' : 'A'}${index + 1}`,
                font: '10pt sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 1,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, -15),
                heightReference: Cesium.HeightReference.NONE,
                show: false // 默认隐藏标签
            }
        });
        
        // 添加点击事件处理
        startPoint.point.id = `event_${index}`;
        endPoint.point.id = `event_${index}`;
        
        // 为轨迹线也添加点击事件
        polyline.id = `event_${index}`;
        
        validEvents++;
    });
    
    console.log(`统计: 电离层掩星 ${ionoCount} 条, 大气掩星 ${atmCount} 条`);
    return { total: validEvents, iono: ionoCount, atm: atmCount };
}

// 添加图例
function addLegend(viewer, stats) {
    const legend = document.createElement('div');
    legend.style.position = 'absolute';
    legend.style.top = '10px';
    legend.style.right = '10px';
    legend.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    legend.style.color = 'white';
    legend.style.padding = '12px';
    legend.style.borderRadius = '6px';
    legend.style.fontSize = '12px';
    legend.style.fontFamily = 'Arial, sans-serif';
    legend.style.zIndex = '1000';
    legend.style.minWidth = '200px';
    
    legend.innerHTML = `
        <div style="margin-bottom: 8px; font-weight: bold; text-align: center;">掩星轨迹图例</div>
        <div style="display: flex; align-items: center; margin-bottom: 6px;">
            <div style="width: 20px; height: 3px; background-color: cyan; margin-right: 8px;"></div>
            <span>电离层掩星 (${stats.iono}条)</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 6px;">
            <div style="width: 20px; height: 3px; background-color: orange; margin-right: 8px;"></div>
            <span>大气掩星 (${stats.atm}条)</span>
        </div>
        <div style="border-top: 1px solid #555; margin: 8px 0; padding-top: 6px; font-size: 10px; opacity: 0.9;">
            <div>标记说明:</div>
            <div>I = 电离层掩星起点/终点</div>
            <div>A = 大气掩星起点/终点</div>
        </div>
        <div style="font-size: 10px; margin-top: 6px; opacity: 0.8; text-align: center;">
            操作: 鼠标拖拽旋转 | 滚轮缩放 | 双击定位 | 点击轨迹显示编号
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
            
            const stats = addOccultationTrajectories(viewer, data);
            addLegend(viewer, stats);
            
            // 添加点击事件处理
            viewer.screenSpaceEventHandler.setInputAction(function(click) {
                const pickedObject = viewer.scene.pick(click.position);
                if (Cesium.defined(pickedObject)) {
                    const entity = pickedObject.id;
                    if (entity && entity.id && entity.id.startsWith('event_')) {
                        // 隐藏所有标签
                        viewer.entities.values.forEach(function(e) {
                            if (e.label) {
                                e.label.show = false;
                            }
                        });
                        
                        // 显示选中事件的标签
                        const eventIndex = entity.id.split('_')[1];
                        viewer.entities.values.forEach(function(e) {
                            if (e.id === `event_${eventIndex}` && e.label) {
                                e.label.show = true;
                            }
                        });
                        
                        console.log(`选中掩星事件 ${parseInt(eventIndex) + 1}`);
                    }
                } else {
                    // 点击空白区域，隐藏所有标签
                    viewer.entities.values.forEach(function(e) {
                        if (e.label) {
                            e.label.show = false;
                        }
                    });
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
            
            console.log(`Cesium渲染完成!显示${validEvents}条轨迹。支持鼠标拖拽、滚轮缩放、双击定位。`);
            showStatus(`Cesium渲染完成!显示${validEvents}条轨迹。支持鼠标拖拽、滚轮缩放、双击定位。`);
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