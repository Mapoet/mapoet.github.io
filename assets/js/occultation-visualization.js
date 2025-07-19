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
    //console.log(message);
}

// 检查Cesium是否可用
function checkCesium() {
    showStatus('检查Cesium库...');
    
    if (typeof Cesium === 'undefined') {
        showStatus('错误：Cesium 库未正确加载');
        return false;
    }
    
    //console.log('Cesium版本:', Cesium.VERSION);
    //console.log('Cesium对象:', Cesium);
    
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
    //console.log('初始化Cesium Viewer...');
    
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
    
    // 配置时间轴样式
    const timeline = viewer.timeline;
    timeline.container.style.height = '80px';
    timeline.container.style.fontSize = '12px';
    
    // 尝试添加真实地球纹理
    try {
        // 移除所有默认图层
        viewer.scene.globe.imageryLayers.removeAll();
        //console.log('已移除所有默认图层');
        
        // 使用OpenStreetMap实现昼夜交替
        updateLighting(viewer);
        
    } catch (error) {
        console.error('所有纹理添加失败:', error);
        
        // 最后方案：创建蓝色地球材质
        const earthMaterial = Cesium.Material.fromType('Color', {
            color: new Cesium.Color(0.2, 0.5, 0.8, 1.0) // 蓝色地球
        });
        viewer.scene.globe.material = earthMaterial;
        //console.log('使用蓝色地球作为备选方案');
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
    
    // 时间设置将在数据加载后完成
    viewer.clock.shouldAnimate = true;
    
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
                //console.log('全屏模式切换');
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
                //console.log('回到主页视角');
                break;
                
            case 'i':
                // I键：显示高度信息
                event.preventDefault();
                let heightInfo = '高度信息:\n';
                viewer.entities.values.forEach(function(e, idx) {
                    if (e.position && idx < 10) { // 只显示前10个
                        const cartesian = e.position.getValue(viewer.clock.currentTime);
                        if (cartesian) {
                            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                            const heightKm = cartographic.height / 1000;
                            heightInfo += `事件${idx + 1}: ${heightKm.toFixed(1)}km\n`;
                        }
                    }
                });
                //console.log(heightInfo);
                message = '高度信息已输出到Console';
                break;
                
            case 'r':
                // R键：重置相机
                event.preventDefault();
                viewer.camera.reset();
                message = '重置相机';
                //console.log('重置相机');
                break;
                
            case 't':
                // T键：切换地形显示
                event.preventDefault();
                viewer.scene.globe.showGroundAtmosphere = !viewer.scene.globe.showGroundAtmosphere;
                message = `地形大气: ${viewer.scene.globe.showGroundAtmosphere ? '开启' : '关闭'}`;
                //console.log('地形大气显示:', viewer.scene.globe.showGroundAtmosphere);
                break;
                
            case 'l':
                // L键：切换光照
                event.preventDefault();
                viewer.scene.globe.enableLighting = !viewer.scene.globe.enableLighting;
                message = `光照效果: ${viewer.scene.globe.enableLighting ? '开启' : '关闭'}`;
                //console.log('光照效果:', viewer.scene.globe.enableLighting);
                break;
                
            case 's':
                // S键：切换阴影
                event.preventDefault();
                viewer.scene.shadowMap.enabled = !viewer.scene.shadowMap.enabled;
                message = `阴影效果: ${viewer.scene.shadowMap.enabled ? '开启' : '关闭'}`;
                //console.log('阴影效果:', viewer.scene.shadowMap.enabled);
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
                //console.log('显示所有标签');
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
                //console.log('隐藏所有标签');
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
                    //console.log('图例显示切换:', legend.style.display);
                } else {
                    message = '未找到图例元素';
                    //console.log('未找到图例元素');
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
                    //console.log('昼夜切换测试:', nightLayer.alpha);
                } else {
                    message = '夜间图层未找到';
                    //console.log('夜间图层未找到');
                }
                break;
                
            case 'w':
                // W键：测试时间过滤
                event.preventDefault();
                if (viewer.clock.shouldAnimate) {
                    viewer.clock.shouldAnimate = false;
                    message = '时间动画已暂停';
                } else {
                    viewer.clock.shouldAnimate = true;
                    message = '时间动画已恢复';
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
        //console.log('世界地形添加成功');
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
    
    //console.log('Cesium Viewer初始化完成');
    return viewer;
}

/**
 * @description: 昼夜交替效果
 * @param {*} _viewer
 * @return {*}
 */
function updateLighting(_viewer) {
    // OSM标准风格地图（白天）
    const dayLayer = _viewer.scene.globe.imageryLayers.addImageryProvider(
        new Cesium.UrlTemplateImageryProvider({
            url: 'https://tile-{s}.openstreetmap.fr/hot/{z}/{x}/{y}.png',
            subdomains: ["a", "b", "c", "d"],
        })
    );

    // OSM暗色系地图（夜间）
    const nightLayer = _viewer.scene.globe.imageryLayers.addImageryProvider(
        new Cesium.UrlTemplateImageryProvider({
            url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
            subdomains: ["a", "b", "c", "d"],
        })
    );
    
    // 启用光照
    _viewer.scene.globe.enableLighting = true;
    _viewer.clock.shouldAnimate = true;
    _viewer.clock.multiplier = 1; // 时间加速
    
    // 设置夜间图层初始透明度
    nightLayer.alpha = 0.0;
    
    // 存储图层引用
    _viewer.dayLayer = dayLayer;
    _viewer.nightLayer = nightLayer;
    
    //console.log('OpenStreetMap昼夜交替图层添加成功');
    
    // 启动昼夜交替
    startDayNightCycle(_viewer);
}

/**
 * @description: 启动昼夜循环
 * @param {*} _viewer
 */
function startDayNightCycle(_viewer) {
    // 昼夜纹理切换函数
    function updateDayNightTexture() {
        const time = _viewer.clock.currentTime;
        const date = Cesium.JulianDate.toDate(time);
        const hour = date.getUTCHours();
        
        // 获取夜间图层
        const nightLayer = _viewer.nightLayer;
        if (nightLayer) {
            // 根据时间计算夜间纹理的透明度
            let alpha = 0.0;
            if (hour >= 19 || hour < 5) {
                // 夜间 (18:00-06:00)
                alpha = 1.0;
            } else if (hour >= 5 && hour < 7) {
                // 日出过渡 (06:00-08:00) - 更平滑的过渡
                alpha = 1.0 - (hour - 5 + date.getUTCMinutes() / 60) / 2;
            } else if (hour >= 17 && hour < 19) {
                // 日落过渡 (16:00-18:00) - 更平滑的过渡
                alpha = (hour - 17 + date.getUTCMinutes() / 60) / 2;
            }
            
            // 确保alpha值在0-1范围内
            alpha = Math.max(0.0, Math.min(1.0, alpha));
            
            nightLayer.alpha = alpha;
            //console.log(`时间: ${hour}:${date.getUTCMinutes().toString().padStart(2, '0')}, 夜间纹理透明度: ${alpha.toFixed(2)}`);
        } else {
            //console.log('夜间图层未找到，无法进行昼夜切换');
        }
    }
    
    // 监听时间变化
    _viewer.clock.onTick.addEventListener(updateDayNightTexture);
    
    // 初始更新
    updateDayNightTexture();
}

// 添加掩星轨迹到Cesium
function addOccultationTrajectories(viewer, data) {
    //console.log('添加掩星轨迹到Cesium...');
    
    //const testData = data.slice(0, 100); // 显示前100个事件
    const testData = data; // 显示所有事件
    let validEvents = 0;
    let ionoCount = 0;
    let atmCount = 0;
    
    // 存储所有事件数据用于时间过滤
    viewer.occultationEvents = testData;
    
    testData.forEach((event, index) => {
        if (!event.points || event.points.length < 2) {
            //console.log(`事件 ${index} 点数不足，跳过`);
            return;
        }
        
        //console.log(`事件 ${index} (${event.type}): ${event.points.length}个点`);
        
        // 转换坐标并检查高度
        const positions = event.points.map(point => {
            let height = point.alt;
            
            return Cesium.Cartesian3.fromDegrees(point.lon, point.lat, height * 1000);
        });
        
        // 根据事件类型设置颜色
        let lineColor, lineMaterial;
        if (event.type === 'iono') {
            lineColor = Cesium.Color.CYAN;
            lineMaterial = Cesium.Color.CYAN.withAlpha(0.6); // 降低透明度
            ionoCount++;
        } else if (event.type === 'atm') {
            lineColor = Cesium.Color.ORANGE;
            lineMaterial = Cesium.Color.ORANGE.withAlpha(0.6); // 降低透明度
            atmCount++;
        } else {
            lineColor = Cesium.Color.GRAY;
            lineMaterial = Cesium.Color.GRAY.withAlpha(0.6); // 降低透明度
        }
        
        // 添加轨迹线 - 更细的线条
        const polyline = viewer.entities.add({
            id: `event_${index}_line`,
            name: `${event.type} 掩星轨迹 ${index + 1}`,
            polyline: {
                positions: positions,
                width: 1.5, // 减小线宽
                material: lineMaterial,
                clampToGround: false,
                zIndex: 1000,
                shadows: Cesium.ShadowMode.ENABLED // 启用阴影
            }
        });
        
        // 添加起点标记和标签 - 更小的点
        const startPoint = viewer.entities.add({
            id: `event_${index}_start`,
            position: positions[0],
            point: {
                pixelSize: 3, // 减小点大小
                color: lineColor,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 0.5, // 减小轮廓宽度
                heightReference: Cesium.HeightReference.NONE
            },
            label: {
                text: `${event.type === 'iono' ? 'I' : 'A'}${index + 1}`,
                font: '8pt sans-serif', // 减小字体
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 1,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, -12), // 减小偏移
                heightReference: Cesium.HeightReference.NONE,
                show: false // 默认隐藏标签
            }
        });
        
        // 添加终点标记和标签 - 更小的点
        const endPoint = viewer.entities.add({
            id: `event_${index}_end`,
            position: positions[positions.length - 1],
            point: {
                pixelSize: 3, // 减小点大小
                color: lineColor,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 0.5, // 减小轮廓宽度
                heightReference: Cesium.HeightReference.NONE
            },
            label: {
                text: `${event.type === 'iono' ? 'I' : 'A'}${index + 1}`,
                font: '8pt sans-serif', // 减小字体
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 1,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, -12), // 减小偏移
                heightReference: Cesium.HeightReference.NONE,
                show: false // 默认隐藏标签
            }
        });
        
        // 添加点击事件处理
        startPoint.point.id = `event_${index}`;
        endPoint.point.id = `event_${index}`;
        polyline.polyline.id = `event_${index}`;
        
        validEvents++;
    });
    
    //console.log(`统计: 电离层掩星 ${ionoCount} 条, 大气掩星 ${atmCount} 条`);
    return { total: validEvents, iono: ionoCount, atm: atmCount };
}

// 设置时间系统
function setupTimeSystem(viewer, data) {
    // 尝试从数据中提取时间信息
    let startTime = null;
    let endTime = null;
    
    // 查找数据中的时间字段
    if (data.length > 0) {
        const firstEvent = data[0];
        // 检查常见的时间字段名
        const timeFields = ['time', 'timestamp', 'date', 'datetime', 'start_time', 'event_time'];
        
        for (const field of timeFields) {
            if (firstEvent[field]) {
                startTime = new Date(firstEvent[field]);
                break;
            }
        }
        
        // 如果没有找到时间字段，使用当前时间
        if (!startTime) {
            startTime = new Date();
            console.log('未找到数据时间字段，使用当前时间');
        }
        
        // 设置结束时间为开始时间后24小时
        endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
    } else {
        // 如果没有数据，使用当前时间
        startTime = new Date();
        endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
    }
    
    // 设置Cesium时钟
    viewer.clock.startTime = Cesium.JulianDate.fromDate(startTime);
    viewer.clock.stopTime = Cesium.JulianDate.fromDate(endTime);
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(startTime);
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
    viewer.clock.multiplier = 3600; // 1小时 = 1秒
    
    // 存储时间信息
    viewer.dataStartTime = startTime;
    viewer.dataEndTime = endTime;
    
    console.log(`时间系统设置: 开始时间 ${startTime.toISOString()}, 结束时间 ${endTime.toISOString()}`);
    
    // 启动时间过滤
    startTimeFiltering(viewer);
}

// 启动时间过滤
function startTimeFiltering(viewer) {
    // 监听时间变化
    viewer.clock.onTick.addEventListener(function(clock) {
        updateVisibleEvents(viewer, clock.currentTime);
    });
    
    // 初始更新
    updateVisibleEvents(viewer, viewer.clock.currentTime);
}

// 更新可见事件
function updateVisibleEvents(viewer, currentTime) {
    const currentDate = Cesium.JulianDate.toDate(currentTime);
    const oneHourAgo = new Date(currentDate.getTime() - 60 * 60 * 1000); // 一小时前
    
    // 隐藏所有实体
    viewer.entities.values.forEach(function(entity) {
        if (entity.polyline || entity.point) {
            entity.show = false;
        }
    });
    
    // 显示一小时内的数据
    if (viewer.occultationEvents) {
        let visibleCount = 0;
        
        viewer.occultationEvents.forEach((event, index) => {
            let eventTime = null;
            
            // 尝试从事件数据中提取时间信息
            const timeFields = ['time', 'timestamp', 'date', 'datetime', 'start_time', 'event_time'];
            for (const field of timeFields) {
                if (event[field]) {
                    eventTime = new Date(event[field]);
                    break;
                }
            }
            
            // 如果没有时间信息，使用索引作为时间（模拟时间分布）
            if (!eventTime) {
                // 假设数据按时间顺序排列，使用索引创建模拟时间
                const timeSpan = viewer.dataEndTime.getTime() - viewer.dataStartTime.getTime();
                const timeStep = timeSpan / viewer.occultationEvents.length;
                eventTime = new Date(viewer.dataStartTime.getTime() + index * timeStep);
            }
            
            // 检查事件是否在一小时时间窗口内
            if (eventTime >= oneHourAgo && eventTime <= currentDate) {
                const entityStart = viewer.entities.getById(`event_${index}_start`);
                const entityEnd = viewer.entities.getById(`event_${index}_end`);
                const entityLine = viewer.entities.getById(`event_${index}_line`);
                
                if (entityStart) {
                    entityStart.show = true;
                    visibleCount++;
                }
                if (entityEnd) {
                    entityEnd.show = true;
                    visibleCount++;
                }
                if (entityLine) {
                    entityLine.show = true;
                    visibleCount++;
                }
            }
        });
        
        // 更新状态显示
        const timeStr = currentDate.toISOString().replace('T', ' ').substring(0, 19);
        showStatus(`当前时间: ${timeStr}, 显示事件: ${Math.floor(visibleCount/3)}个`);
    }
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
            地球纹理: OSM昼夜切换 | 地形: 世界地形 | 光照: 太阳光照
        </div>
        <div style="border-top: 1px solid #555; margin: 8px 0; padding-top: 6px; font-size: 9px; opacity: 0.8;">
            <div style="font-weight: bold; margin-bottom: 4px;">时间控制:</div>
            <div>时间轴: 显示历史1小时数据</div>
            <div>时间加速: 1小时/秒</div>
            <div>循环播放: 24小时周期</div>
        </div>
        <div style="border-top: 1px solid #555; margin: 8px 0; padding-top: 6px; font-size: 9px; opacity: 0.8;">
            <div style="font-weight: bold; margin-bottom: 4px;">快捷键:</div>
            <div>F = 全屏切换 | H = 主页视角 | R = 重置相机</div>
            <div>T = 地形大气 | L = 光照切换 | S = 阴影切换</div>
            <div>1 = 显示标签 | 0 = 隐藏标签 | K = 图例切换</div>
            <div>D = 昼夜测试 | I = 高度信息 | W = 时间暂停</div>
        </div>
    `;
    
    document.getElementById('cesiumContainer').appendChild(legend);
}

// 主函数
function initVisualization() {
    //console.log('开始初始化Cesium可视化...');
    
    if (!checkDOM()) {
        //console.log('DOM检查失败');
        return;
    }
    
    if (!checkCesium()) {
        //console.log('Cesium检查失败');
        return;
    }
    
    try {
        // 初始化Cesium Viewer
        const viewer = initCesiumViewer();
        //console.log('Cesium Viewer初始化成功');
        
        // 加载数据
        loadDataForCesium(viewer);
        
    } catch (error) {
        showStatus(`Cesium初始化失败: ${error.message}`);
        console.error('Cesium初始化错误:', error);
    }
}

function loadDataForCesium(viewer) {
    //console.log('开始加载数据用于Cesium...');
    
    // 使用fetch API加载数据
    fetch(eventFile)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            //console.log('Cesium数据加载成功:', data.length, '个事件');
            showStatus(`数据加载成功，共 ${data.length} 个事件`);
            
            // 解析数据时间并设置Cesium时间
            setupTimeSystem(viewer, data);
            
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
                        const startEntity = viewer.entities.getById(`event_${eventIndex}_start`);
                        const endEntity = viewer.entities.getById(`event_${eventIndex}_end`);
                        
                        if (startEntity && startEntity.label) {
                            startEntity.label.show = true;
                        }
                        if (endEntity && endEntity.label) {
                            endEntity.label.show = true;
                        }
                        
                        //console.log(`选中掩星事件 ${parseInt(eventIndex) + 1}`);
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
            
            //console.log(`Cesium渲染完成!显示${stats.total}条轨迹。支持鼠标拖拽、滚轮缩放、双击定位。`);
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