const eventFile = '/assets/data/occultation_events.json';
const statusDiv = document.getElementById('status');

function getColor(type) {
    if (type === 'iono') return '#00ffff';
    if (type === 'atm') return '#ff8800';
    return '#cccccc';
}

function showStatus(message) {
    statusDiv.innerHTML = message;
    console.log(message);
}

// 详细检查所有依赖库
function checkDependencies() {
    showStatus('检查依赖库...');
    
    if (typeof echarts === 'undefined') {
        showStatus('错误：ECharts 库未正确加载');
        return false;
    }
    
    console.log('ECharts版本:', echarts.version);
    console.log('ECharts对象:', echarts);
    
    if (typeof echarts.gl === 'undefined') {
        showStatus('警告：ECharts GL 扩展未正确加载，尝试使用Three.js备选方案');
        console.log('echarts.gl:', echarts.gl);
        return 'use_threejs';
    }
    
    console.log('ECharts GL已加载:', echarts.gl);
    
    if (typeof d3 === 'undefined') {
        showStatus('错误：D3.js 库未正确加载');
        return false;
    }
    
    showStatus('所有依赖库已加载，正在获取数据...');
    return true;
}

// 检查DOM元素
function checkDOM() {
    const mainDiv = document.getElementById('main');
    if (!mainDiv) {
        showStatus('错误：找不到 #main 元素');
        return false;
    }
    
    const statusDiv = document.getElementById('status');
    if (!statusDiv) {
        showStatus('错误：找不到 #status 元素');
        return false;
    }
    
    return true;
}

// 使用Three.js创建3D地球
function createThreeJSVisualization(data) {
    showStatus('使用Three.js创建3D地球可视化...');
    
    // 检查Three.js是否可用
    if (typeof THREE === 'undefined') {
        showStatus('错误：Three.js 库未加载，请添加Three.js CDN');
        return;
    }
    
    const container = document.getElementById('main');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000011); // 深蓝色背景
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    
    // 创建地球 - 使用更好的材质和纹理
    const earthGeometry = new THREE.SphereGeometry(5, 64, 64);
    
    // 创建地球材质 - 使用PhongMaterial获得更好的光照效果
    const earthMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x0066cc,
        transparent: true,
        opacity: 0.9,
        shininess: 30
    });
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);
    
    // 添加大气层效果
    const atmosphereGeometry = new THREE.SphereGeometry(5.2, 64, 64);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x0066cc,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);
    
    // 添加光照
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 5, 5);
    scene.add(directionalLight);
    
    // 添加轨迹线
    const testData = data.slice(0, 5);
    testData.forEach((event, index) => {
        if (!event.points || event.points.length < 2) return;
        
        const points = event.points.map(p => {
            const lon = (parseFloat(p.lon) || 0) * Math.PI / 180;
            const lat = (parseFloat(p.lat) || 0) * Math.PI / 180;
            const alt = parseFloat(p.alt) || 0;
            const radius = 5 + alt / 100; // 地球半径 + 高度
            
            const x = radius * Math.cos(lat) * Math.cos(lon);
            const y = radius * Math.sin(lat);
            const z = radius * Math.cos(lat) * Math.sin(lon);
            
            return new THREE.Vector3(x, y, z);
        });
        
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: getColor(event.type),
            linewidth: 3,
            transparent: true,
            opacity: 0.8
        });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        scene.add(line);
        
        // 添加轨迹起点和终点的标记
        if (points.length > 0) {
            const startPoint = points[0];
            const endPoint = points[points.length - 1];
            
            // 起点标记
            const startGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const startMaterial = new THREE.MeshBasicMaterial({ color: getColor(event.type) });
            const startMarker = new THREE.Mesh(startGeometry, startMaterial);
            startMarker.position.copy(startPoint);
            scene.add(startMarker);
            
            // 终点标记
            const endGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const endMaterial = new THREE.MeshBasicMaterial({ color: getColor(event.type) });
            const endMarker = new THREE.Mesh(endGeometry, endMaterial);
            endMarker.position.copy(endPoint);
            scene.add(endMarker);
        }
    });
    
    camera.position.z = 15;
    
    // 添加鼠标/触屏控制
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let currentRotationX = 0;
    let currentRotationY = 0;
    
    // 鼠标事件
    renderer.domElement.addEventListener('mousedown', function(event) {
        isMouseDown = true;
        mouseX = event.clientX;
        mouseY = event.clientY;
    });
    
    renderer.domElement.addEventListener('mousemove', function(event) {
        if (isMouseDown) {
            const deltaX = event.clientX - mouseX;
            const deltaY = event.clientY - mouseY;
            
            targetRotationY += deltaX * 0.01;
            targetRotationX += deltaY * 0.01;
            
            // 限制垂直旋转角度
            targetRotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, targetRotationX));
            
            mouseX = event.clientX;
            mouseY = event.clientY;
        }
    });
    
    renderer.domElement.addEventListener('mouseup', function() {
        isMouseDown = false;
    });
    
    renderer.domElement.addEventListener('mouseleave', function() {
        isMouseDown = false;
    });
    
    // 触屏事件
    renderer.domElement.addEventListener('touchstart', function(event) {
        event.preventDefault();
        if (event.touches.length === 1) {
            isMouseDown = true;
            mouseX = event.touches[0].clientX;
            mouseY = event.touches[0].clientY;
        }
    });
    
    renderer.domElement.addEventListener('touchmove', function(event) {
        event.preventDefault();
        if (isMouseDown && event.touches.length === 1) {
            const deltaX = event.touches[0].clientX - mouseX;
            const deltaY = event.touches[0].clientY - mouseY;
            
            targetRotationY += deltaX * 0.01;
            targetRotationX += deltaY * 0.01;
            
            targetRotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, targetRotationX));
            
            mouseX = event.touches[0].clientX;
            mouseY = event.touches[0].clientY;
        }
    });
    
    renderer.domElement.addEventListener('touchend', function(event) {
        event.preventDefault();
        isMouseDown = false;
    });
    
    // 滚轮缩放
    renderer.domElement.addEventListener('wheel', function(event) {
        event.preventDefault();
        const zoomSpeed = 0.1;
        const delta = event.deltaY > 0 ? 1 : -1;
        camera.position.z += delta * zoomSpeed;
        camera.position.z = Math.max(8, Math.min(30, camera.position.z));
    });
    
    // 动画循环
    function animate() {
        requestAnimationFrame(animate);
        
        // 平滑旋转
        currentRotationX += (targetRotationX - currentRotationX) * 0.1;
        currentRotationY += (targetRotationY - currentRotationY) * 0.1;
        
        earth.rotation.x = currentRotationX;
        earth.rotation.y = currentRotationY;
        atmosphere.rotation.x = currentRotationX;
        atmosphere.rotation.y = currentRotationY;
        
        // 如果没有鼠标交互，自动旋转
        if (!isMouseDown) {
            earth.rotation.y += 0.005;
            atmosphere.rotation.y += 0.005;
            targetRotationY += 0.005;
            currentRotationY += 0.005;
        }
        
        renderer.render(scene, camera);
    }
    
    animate();
    showStatus(`Three.js渲染完成！显示 ${testData.length} 条轨迹。支持鼠标拖拽和滚轮缩放。`);
}

// 主函数
function initVisualization() {
    console.log('开始初始化可视化...');
    
    if (!checkDOM()) {
        console.log('DOM检查失败');
        return;
    }
    
    const depsResult = checkDependencies();
    console.log('依赖检查结果:', depsResult);
    
    if (depsResult === false) {
        console.log('依赖检查失败');
        return;
    }
    
    if (depsResult === 'use_threejs') {
        console.log('切换到Three.js备选方案');
        // 使用Three.js备选方案
        loadDataForThreeJS();
        return;
    }
    
    console.log('使用ECharts GL方案');
    // 使用ECharts GL
    try {
        const testChart = echarts.init(document.getElementById('main'));
        const testOption = {
            backgroundColor: '#000',
            globe: {
                // 使用简化的地球配置，避免CORS问题
                baseTexture: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1透明图片
                heightTexture: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1透明图片
                shading: 'color',
                environment: '#222',
                globeOuterRadius: 100,
                viewControl: {
                    autoRotate: true,
                    autoRotateAfterStill: 5,
                    distance: 200
                },
                light: {
                    main: { intensity: 1.2 },
                    ambient: { intensity: 0.5 }
                }
            },
            series: []
        };
        
        testChart.setOption(testOption);
        showStatus('基础地球渲染成功，正在加载数据...');
        console.log('基础地球渲染成功');
        
        // 加载数据
        loadData(testChart);
        
    } catch (error) {
        showStatus(`ECharts初始化失败: ${error.message}`);
        console.error('ECharts初始化错误:', error);
    }
}

function loadDataForThreeJS() {
    console.log('开始加载数据用于Three.js...');
    d3.json(eventFile)
        .then(function(data) {
            console.log('Three.js数据加载成功:', data.length, '个事件');
            showStatus(`数据加载成功，共 ${data.length} 个事件`);
            createThreeJSVisualization(data);
        })
        .catch(function(error) {
            console.error('Three.js数据加载失败:', error);
            showStatus(`数据加载失败: ${error.message}`);
        });
}

function loadData(chart) {
    d3.json(eventFile)
        .then(function(data) {
            showStatus(`数据加载成功，共 ${data.length} 个事件`);
            console.log('数据预览:', data.slice(0, 2));
            
            // 只取前5个事件进行测试
            const testData = data.slice(0, 5);
            showStatus(`测试模式：只显示前 ${testData.length} 个事件`);
            
            const series = [];
            let validEvents = 0;
            
            testData.forEach((event, index) => {
                if (!event.points || event.points.length < 2) {
                    console.log(`事件 ${index} 点数不足:`, event.points?.length);
                    return;
                }
                
                const coords = event.points.map(p => {
                    const lon = parseFloat(p.lon) || 0;
                    const lat = parseFloat(p.lat) || 0;
                    const alt = parseFloat(p.alt) || 0;
                    return [lon, lat, alt * 100]; // ECharts GL高度单位为km*100
                });
                
                console.log(`事件 ${index} (${event.type}): ${coords.length} 个点`);
                console.log(`坐标范围: lon[${Math.min(...coords.map(c=>c[0]))}, ${Math.max(...coords.map(c=>c[0]))}], lat[${Math.min(...coords.map(c=>c[1]))}, ${Math.max(...coords.map(c=>c[1]))}], alt[${Math.min(...coords.map(c=>c[2]))}, ${Math.max(...coords.map(c=>c[2]))}]`);
                
                series.push({
                    type: 'lines3D',
                    coordinateSystem: 'globe',
                    effect: {
                        show: true,
                        trailWidth: 2,
                        trailLength: 0.2,
                        trailOpacity: 0.7,
                        trailColor: getColor(event.type)
                    },
                    lineStyle: {
                        width: 2,
                        color: getColor(event.type),
                        opacity: 0.8
                    },
                    data: coords
                });
                validEvents++;
            });
            
            showStatus(`有效事件: ${validEvents}/${testData.length}，正在渲染轨迹...`);
            console.log('Series配置:', series);
            
            // 更新图表
            const option = {
                backgroundColor: '#000',
                globe: {
                    // 使用简化的地球配置，避免CORS问题
                    baseTexture: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1透明图片
                    heightTexture: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1透明图片
                    shading: 'color',
                    environment: '#222',
                    globeOuterRadius: 100,
                    viewControl: {
                        autoRotate: true,
                        autoRotateAfterStill: 5,
                        distance: 200
                    },
                    light: {
                        main: { intensity: 1.2 },
                        ambient: { intensity: 0.5 }
                    }
                },
                series: series
            };
            
            console.log('ECharts配置:', option);
            chart.setOption(option, true); // 第二个参数为true表示完全替换
            showStatus(`渲染完成！共显示 ${validEvents} 条轨迹`);
        })
        .catch(function(error) {
            showStatus(`数据加载失败: ${error.message}`);
            console.error('数据加载错误:', error);
        });
}

// 等待DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVisualization);
} else {
    initVisualization();
} 