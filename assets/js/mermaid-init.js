/**
 * Mermaid图表渲染初始化脚本
 * 支持在markdown和HTML中渲染mermaid图表
 */

(function() {
  'use strict';

  let mermaidInitialized = false;
  let mermaidLibraryLoaded = false;

  // 检查Mermaid库是否已加载
  function checkMermaidLibrary() {
    if (typeof mermaid !== 'undefined') {
      mermaidLibraryLoaded = true;
      console.log('✅ Mermaid library loaded, version:', mermaid.version || 'unknown');
      return true;
    } else {
      console.log('⏳ Mermaid library not yet loaded, waiting...');
      return false;
    }
  }

  // 等待DOM加载完成
  document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, checking Mermaid library...');
    
    // 如果库已加载，立即初始化
    if (checkMermaidLibrary()) {
      initMermaid();
    } else {
      // 等待库加载完成
      waitForMermaidLibrary();
    }
  });

  // 等待Mermaid库加载
  function waitForMermaidLibrary() {
    let attempts = 0;
    const maxAttempts = 50; // 最多等待5秒
    
    const checkInterval = setInterval(function() {
      attempts++;
      console.log('Checking Mermaid library, attempt:', attempts);
      
      if (checkMermaidLibrary()) {
        clearInterval(checkInterval);
        initMermaid();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.error('❌ Mermaid library failed to load after', maxAttempts, 'attempts');
        showMermaidError('Mermaid库加载超时，请刷新页面重试');
      }
    }, 100);
  }

  function initMermaid() {
    if (mermaidInitialized) {
      console.log('Mermaid already initialized, skipping...');
      return;
    }
    
    if (!mermaidLibraryLoaded) {
      console.error('Mermaid library not loaded');
      showMermaidError('Mermaid库加载失败，请刷新页面重试');
      return;
    }
    
    console.log('🚀 Initializing Mermaid...');
    
    // 初始化mermaid配置
    mermaid.initialize({
      startOnLoad: false, // 手动控制渲染
      theme: 'default',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      },
      sequence: {
        useMaxWidth: true,
        diagramMarginX: 50,
        diagramMarginY: 10,
        actorMargin: 50,
        width: 150,
        height: 65,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35,
        mirrorActors: true,
        bottomMarginAdj: 1,
        useMaxWidth: true,
        rightAngles: false,
        showSequenceNumbers: false
      },
      gantt: {
        titleTopMargin: 25,
        barHeight: 20,
        barGap: 4,
        topPadding: 50,
        leftPadding: 75,
        gridLineStartPadding: 35,
        fontSize: 11,
        fontFamily: '"Open-Sans", "sans-serif"',
        numberSectionStyles: 4,
        axisFormat: '%Y-%m-%d'
      },
      class: {
        useMaxWidth: true,
        htmlLabels: true
      },
      gitGraph: {
        useMaxWidth: true,
        htmlLabels: true,
        diagaramPadding: 8,
        titleTopMargin: 25,
        nodeSpacing: 50,
        rankSpacing: 50,
        curve: 'basis'
      }
    });

    mermaidInitialized = true;
    console.log('✅ Mermaid initialized successfully');

    // 延迟处理，确保DOM完全加载
    setTimeout(function() {
      processMermaidCodeBlocks();
      processMermaidElements();
    }, 200);
  }

  function processMermaidCodeBlocks() {
    // 查找所有mermaid代码块
    const mermaidBlocks = document.querySelectorAll('pre code.language-mermaid, pre code.language-mermaidjs');
    
    console.log('🔍 Found', mermaidBlocks.length, 'mermaid code blocks');
    
    if (mermaidBlocks.length === 0) {
      console.log('No mermaid code blocks found on this page');
      return;
    }
    
    mermaidBlocks.forEach(function(block, index) {
      const pre = block.parentElement;
      const diagramId = 'mermaid-diagram-' + index + '-' + Date.now();
      
      // 创建容器
      const container = document.createElement('div');
      container.className = 'mermaid-diagram';
      container.id = diagramId;
      container.style.textAlign = 'center';
      container.style.margin = '20px 0';
      container.style.padding = '15px';
      container.style.background = '#f8f9fa';
      container.style.borderRadius = '8px';
      container.style.border = '1px solid #e9ecef';
      container.style.minHeight = '100px';
      
      // 添加加载提示
      container.innerHTML = '<div style="color: #6c757d; font-style: italic;">正在渲染图表...</div>';
      
      // 替换pre元素
      pre.parentNode.insertBefore(container, pre);
      pre.style.display = 'none';
      
      // 渲染mermaid图表
      try {
        const graphDefinition = block.textContent || block.innerText;
        console.log('🎨 Rendering diagram', diagramId, 'with definition:', graphDefinition.substring(0, 100) + '...');
        
        mermaid.render(diagramId, graphDefinition, function(svgCode) {
          container.innerHTML = svgCode;
          console.log('✅ Successfully rendered diagram', diagramId);
        });
      } catch (error) {
        console.error('❌ Mermaid rendering error for', diagramId, ':', error);
        container.innerHTML = '<div style="color: red; padding: 20px; border: 1px solid red; background: #fff5f5;">Mermaid图表渲染失败: ' + error.message + '</div>';
      }
    });
  }

  function processMermaidElements() {
    // 查找所有带有mermaid类的元素
    const mermaidElements = document.querySelectorAll('.mermaid, [data-mermaid]');
    
    console.log('🔍 Found', mermaidElements.length, 'mermaid elements');
    
    if (mermaidElements.length === 0) {
      console.log('No mermaid elements found on this page');
      return;
    }
    
    mermaidElements.forEach(function(element, index) {
      const diagramId = 'mermaid-element-' + index + '-' + Date.now();
      element.id = diagramId;
      
      // 渲染mermaid图表
      try {
        const graphDefinition = element.textContent || element.innerText;
        console.log('🎨 Rendering element', diagramId, 'with definition:', graphDefinition.substring(0, 100) + '...');
        
        mermaid.render(diagramId, graphDefinition, function(svgCode) {
          element.innerHTML = svgCode;
          console.log('✅ Successfully rendered element', diagramId);
        });
      } catch (error) {
        console.error('❌ Mermaid rendering error for', diagramId, ':', error);
        element.innerHTML = '<div style="color: red; padding: 20px; border: 1px solid red; background: #fff5f5;">Mermaid图表渲染失败: ' + error.message + '</div>';
      }
    });
  }

  function showMermaidError(message) {
    console.error('🚨 Mermaid Error:', message);
    
    // 在所有mermaid代码块位置显示错误信息
    const mermaidBlocks = document.querySelectorAll('pre code.language-mermaid, pre code.language-mermaidjs');
    mermaidBlocks.forEach(function(block) {
      const pre = block.parentElement;
      const errorDiv = document.createElement('div');
      errorDiv.style.color = 'red';
      errorDiv.style.padding = '20px';
      errorDiv.style.border = '1px solid red';
      errorDiv.style.background = '#fff5f5';
      errorDiv.style.margin = '20px 0';
      errorDiv.style.borderRadius = '8px';
      errorDiv.textContent = message;
      
      pre.parentNode.insertBefore(errorDiv, pre);
      pre.style.display = 'none';
    });
  }

  // 监听动态内容变化（用于SPA或动态加载的内容）
  function observeMermaidChanges() {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          // 检查新添加的节点是否包含mermaid内容
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const mermaidBlocks = node.querySelectorAll ? node.querySelectorAll('pre code.language-mermaid, pre code.language-mermaidjs') : [];
              const mermaidElements = node.querySelectorAll ? node.querySelectorAll('.mermaid, [data-mermaid]') : [];
              
              if (mermaidBlocks.length > 0 || mermaidElements.length > 0) {
                console.log('🔄 New mermaid content detected, re-processing...');
                // 延迟处理，确保DOM完全更新
                setTimeout(function() {
                  if (mermaidInitialized) {
                    processMermaidCodeBlocks();
                    processMermaidElements();
                  }
                }, 100);
              }
            }
          });
        }
      });
    });

    // 开始观察
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('👀 MutationObserver started for dynamic content');
  }

  // 启动观察器
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeMermaidChanges);
  } else {
    observeMermaidChanges();
  }

})(); 