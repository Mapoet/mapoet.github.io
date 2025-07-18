const eventFile = '/assets/data/occultation_events.json';
const statusDiv = document.getElementById('status');

// 设置Cesium Ion访问令牌 - 使用用户申请的token
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzOTZhYjUxMy0yM2RhLTQzYTQtYjVmNy1hNTI1NjZiNGI5NDgiLCJpZCI6MzIyODkzLCJpYXQiOjE3NTI4ODExMTd9.ZW3143EaO-0r7H7Tr9Q0rfboNl2FjBWUzm2JgcEKj5g';

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
        animation: true, // 启用动画控件
        timeline: true, // 启用时间轴
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
        
        // 方案1：使用Cesium World Imagery（高质量，需要token）
        try {
            const worldImagery = Cesium.createWorldImagery();
            viewer.scene.globe.imageryLayers.addImageryProvider(worldImagery);
            console.log('Cesium World Imagery高质量地球纹理添加成功');
            
            // 添加夜间纹理图层 - 使用更可靠的方式
            try {
                const nightImagery = new Cesium.IonImageryProvider({
                    assetId: 3845 // Cesium World Imagery Night
                });
                const nightLayer = viewer.scene.globe.imageryLayers.addImageryProvider(nightImagery);
                nightLayer.alpha = 0.0; // 初始透明
                console.log('夜间纹理图层添加成功');
                
                // 存储夜间图层引用
                viewer.nightLayer = nightLayer;
            } catch (nightError) {
                console.error('夜间纹理加载失败:', nightError);
                // 尝试使用备选夜间纹理
                try {
                    const nightImagery2 = new Cesium.IonImageryProvider({
                        assetId: 3845,
                        accessToken: Cesium.Ion.defaultAccessToken
                    });
                    const nightLayer2 = viewer.scene.globe.imageryLayers.addImageryProvider(nightImagery2);
                    nightLayer2.alpha = 0.0;
                    viewer.nightLayer = nightLayer2;
                    console.log('备选夜间纹理图层添加成功');
                } catch (nightError2) {
                    console.error('备选夜间纹理也失败:', nightError2);
                }
            }
            
        } catch (worldError) {
            console.error('Cesium World Imagery失败:', worldError);
            
            // 方案2：使用OpenStreetMap（免费，无需API密钥）
            const osmProvider = new Cesium.OpenStreetMapImageryProvider({
                url: 'https://a.tile.openstreetmap.org/'
            });
            viewer.scene.globe.imageryLayers.addImageryProvider(osmProvider);
            console.log('OpenStreetMap地球纹理添加成功');
        }
        
    } catch (error) {
        console.error('所有纹理添加失败:', error);
        
        // 最后方案：创建蓝色地球材质
        const earthMaterial = Cesium.Material.fromType('Color', {
            color: new Cesium.Color(0.2, 0.5, 0.8, 1.0) // 蓝色地球
        });
        viewer.scene.globe.material = earthMaterial;
        console.log('使用蓝色地球作为备选方案');
    }
    
    // 配置场景
    const scene = viewer.scene;
    scene.globe.enableLighting = true; // 启用光照
    scene.globe.atmosphereLighting = true; // 启用大气光照
    scene.globe.atmosphereLightingIntensity = 5.0; // 大气光照强度
    scene.globe.atmosphereHueShift = 0.1; // 大气色调偏移
    scene.globe.atmosphereSaturationShift = 0.1; // 大气饱和度偏移
    scene.globe.atmosphereBrightnessShift = 1.0; // 大气亮度偏移
    
    // 启用太阳光照
    scene.globe.enableLighting = true;
    scene.sun = new Cesium.Sun();
    scene.moon = new Cesium.Moon();
    scene.skyBox = new Cesium.SkyBox({
        sources: {
            positiveX: 'https://cesium.com/downloads/cesiumjs/releases/1.95/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_px.jpg',
            negativeX: 'https://cesium.com/downloads/cesiumjs/releases/1.95/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_mx.jpg',
            positiveY: 'https://cesium.com/downloads/cesiumjs/releases/1.95/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_py.jpg',
            negativeY: 'https://cesium.com/downloads/cesiumjs/releases/1.95/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_my.jpg',
            positiveZ: 'https://cesium.com/downloads/cesiumjs/releases/1.95/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_pz.jpg',
            negativeZ: 'https://cesium.com/downloads/cesiumjs/releases/1.95/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_mz.jpg'
        }
    });
    
    // 设置当前时间为真实时间
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date());
    viewer.clock.shouldAnimate = true;
    
    // 昼夜纹理切换函数
    function updateDayNightTexture() {
        const time = viewer.clock.currentTime;
        const date = Cesium.JulianDate.toDate(time);
        const hour = date.getUTCHours();
        
        // 获取夜间图层
        const nightLayer = viewer.nightLayer;
        if (nightLayer) {
            // 根据时间计算夜间纹理的透明度
            let alpha = 0.0;
            if (hour >= 18 || hour < 6) {
                // 夜间 (18:00-06:00)
                alpha = 1.0;
            } else if (hour >= 6 && hour < 8) {
                // 日出过渡 (06:00-08:00) - 更平滑的过渡
                alpha = 1.0 - (hour - 6 + date.getUTCMinutes() / 60) / 2;
            } else if (hour >= 16 && hour < 18) {
                // 日落过渡 (16:00-18:00) - 更平滑的过渡
                alpha = (hour - 16 + date.getUTCMinutes() / 60) / 2;
            }
            
            // 确保alpha值在0-1范围内
            alpha = Math.max(0.0, Math.min(1.0, alpha));
            
            nightLayer.alpha = alpha;
            console.log(`时间: ${hour}:${date.getUTCMinutes().toString().padStart(2, '0')}, 夜间纹理透明度: ${alpha.toFixed(2)}`);
        } else {
            console.log('夜间图层未找到，无法进行昼夜切换');
        }
    }
    
    // 监听时间变化
    viewer.clock.onTick.addEventListener(updateDayNightTexture);
    
    // 初始更新
    updateDayNightTexture();
    
    // 添加键盘快捷键支持
    document.addEventListener('keydown', function(event) {
        let message = '';
        
        switch(event.key.toLowerCase()) {
            case 'f':
                // F键：切换全屏
                event.preventDefault();
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                    message = '退出全屏模式';
                } else {
                    document.getElementById('cesiumContainer').requestFullscreen();
                    message = '进入全屏模式';
                }
                console.log('全屏模式切换');
                break;
                
            case 'h':
                // H键：回到主页视角
                event.preventDefault();
                viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000),
                    orientation: {
                        heading: 0.0,
                        pitch: -Cesium.Math.PI_OVER_TWO,
                        roll: 0.0
                    },
                    duration: 2.0
                });
                message = '回到主页视角';
                console.log('回到主页视角');
                break;
                
            case 'r':
                // R键：重置相机
                event.preventDefault();
                viewer.camera.reset();
                message = '重置相机';
                console.log('重置相机');
                break;
                
            case 't':
                // T键：切换地形显示
                event.preventDefault();
                viewer.scene.globe.showGroundAtmosphere = !viewer.scene.globe.showGroundAtmosphere;
                message = `地形大气: ${viewer.scene.globe.showGroundAtmosphere ? '开启' : '关闭'}`;
                console.log('地形大气显示:', viewer.scene.globe.showGroundAtmosphere);
                break;
                
            case 'l':
                // L键：切换光照
                event.preventDefault();
                viewer.scene.globe.enableLighting = !viewer.scene.globe.enableLighting;
                message = `光照效果: ${viewer.scene.globe.enableLighting ? '开启' : '关闭'}`;
                console.log('光照效果:', viewer.scene.globe.enableLighting);
                break;
                
            case 's':
                // S键：切换阴影
                event.preventDefault();
                viewer.scene.shadowMap.enabled = !viewer.scene.shadowMap.enabled;
                message = `阴影效果: ${viewer.scene.shadowMap.enabled ? '开启' : '关闭'}`;
                console.log('阴影效果:', viewer.scene.shadowMap.enabled);
                break;
                
            case '1':
                // 1键：显示所有标签
                event.preventDefault();
                viewer.entities.values.forEach(function(e) {
                    if (e.label) {
                        e.label.show = true;
                    }
                });
                message = '显示所有标签';
                console.log('显示所有标签');
                break;
                
            case '0':
                // 0键：隐藏所有标签
                event.preventDefault();
                viewer.entities.values.forEach(function(e) {
                    if (e.label) {
                        e.label.show = false;
                    }
                });
                message = '隐藏所有标签';
                console.log('隐藏所有标签');
                break;
                
            case 'k':
                // K键：切换图例显示
                event.preventDefault();
                // 查找图例元素（通过多个选择器确保找到）
                let legend = document.querySelector('#cesiumContainer > div[style*="position: absolute"][style*="top: 10px"][style*="right: 10px"]');
                if (!legend) {
                    legend = document.querySelector('#cesiumContainer > div[style*="background-color: rgba(0, 0, 0, 0.8)"]');
                }
                if (!legend) {
                    legend = document.querySelector('#cesiumContainer > div:last-child');
                }
                
                if (legend && legend.innerHTML.includes('掩星轨迹图例')) {
                    legend.style.display = legend.style.display === 'none' ? 'block' : 'none';
                    message = `图例显示: ${legend.style.display === 'none' ? '关闭' : '开启'}`;
                    console.log('图例显示切换:', legend.style.display);
                } else {
                    message = '未找到图例元素';
                    console.log('未找到图例元素');
                }
                break;
                
            case 'd':
                // D键：测试昼夜切换
                event.preventDefault();
                const nightLayer = viewer.nightLayer;
                if (nightLayer) {
                    const currentAlpha = nightLayer.alpha;
                    nightLayer.alpha = currentAlpha > 0.5 ? 0.0 : 1.0;
                    message = `昼夜切换测试: ${nightLayer.alpha > 0.5 ? '夜间' : '白天'}`;
                    console.log('昼夜切换测试:', nightLayer.alpha);
                } else {
                    message = '夜间图层未找到';
                    console.log('夜间图层未找到');
                }
                break;
                
            case 'escape':
                // ESC键：退出全屏
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                    message = '退出全屏模式';
                }
                break;
        }
        
        // 显示快捷键提示
        if (message) {
            showStatus(message);
            // 3秒后清除提示
            setTimeout(() => {
                showStatus(`Cesium渲染完成!显示${stats.total}条轨迹。支持鼠标拖拽、滚轮缩放、双击定位。`);
            }, 3000);
        }
    });
    
    // 启用地形
    try {
        const worldTerrain = Cesium.createWorldTerrain();
        viewer.terrainProvider = worldTerrain;
        console.log('世界地形添加成功');
    } catch (terrainError) {
        console.error('地形添加失败:', terrainError);
    }
    
    // 启用阴影
    scene.shadowMap.enabled = true;
    scene.shadowMap.size = 2048; // 阴影贴图大小
    
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
    
    const testData = data.slice(0, 100); // 显示前100个事件
    //const testData = data; // 显示所有事件
    let validEvents = 0;
    let ionoCount = 0;
    let atmCount = 0;
    
    testData.forEach((event, index) => {
        if (!event.points || event.points.length < 2) {
            console.log(`事件 ${index} 点数不足，跳过`);
            return;
        }
        
        console.log(`事件 ${index} (${event.type}): ${event.points.length}个点`);
        
        // 转换坐标
        const positions = event.points.map(point => 
            Cesium.Cartesian3.fromDegrees(point.lon, point.lat, point.alt * 1000)
        );
        
        // 根据事件类型设置颜色
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
                width: 3, // 增加线宽
                material: lineMaterial,
                clampToGround: false,
                zIndex: 1000,
                shadows: Cesium.ShadowMode.ENABLED // 启用阴影
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
        <div style="font-size: 9px; margin-top: 4px; opacity: 0.7; text-align: center;">
            地球纹理: 昼夜切换 | 地形: 世界地形 | 光照: 太阳光照
        </div>
        <div style="border-top: 1px solid #555; margin: 8px 0; padding-top: 6px; font-size: 9px; opacity: 0.8;">
            <div style="font-weight: bold; margin-bottom: 4px;">快捷键:</div>
            <div>F = 全屏切换 | H = 主页视角 | R = 重置相机</div>
            <div>T = 地形大气 | L = 光照切换 | S = 阴影切换</div>
            <div>1 = 显示标签 | 0 = 隐藏标签 | K = 图例切换</div>
            <div>D = 昼夜测试 | ESC = 退出全屏</div>
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
            
            console.log(`Cesium渲染完成!显示${stats.total}条轨迹。支持鼠标拖拽、滚轮缩放、双击定位。`);
            showStatus(`Cesium渲染完成!显示${stats.total}条轨迹。支持鼠标拖拽、滚轮缩放、双击定位。`);
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