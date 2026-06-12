(function () {
  "use strict";

  const DEFAULT_MARKDOWN = `# Markdown 演示

这是一段**正文文字**。现代排版注重\`呼吸感\`，行高 1.75，阅读更舒适。

> **引用块**：左侧主题色边框、柔和背景，适合放置提示或重要引言。

## 1. 优雅的数据表格

| 能力 | 库 | 说明 |
| --- | --- | --- |
| Markdown | marked | 解析为 HTML |
| 公式 | KaTeX | 行内与块级 LaTeX |
| 图表 | Mermaid | 流程图与序列图 |
| 代码 | Highlight.js | Atom One Dark 高亮 |
| 截图 | html2canvas | 高清 PNG 导出 |

## 2. 专业的代码高亮

\`\`\`javascript
function calculateFactorial(n) {
  if (n <= 1) return 1;
  return n * calculateFactorial(n - 1);
}
console.log(\`5! = \${calculateFactorial(5)}\`);
\`\`\`

## 3. 精美的数学公式

行内公式 $E = mc^2$ 融入文本基线。

块级公式获得浅色背景与虚线边框：
$$
\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}
$$

## 4. 深度定制的 Mermaid 图表

\`\`\`mermaid
graph TD
  A([用户请求]) --> B{身份验证}
  B -->|Token 有效| C[获取数据]
  B -->|Token 无效| D([返回 401])
  C --> E[渲染视图]
  E --> F([响应成功])

  style A fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
  style F fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
\`\`\`
`;

  const MERMAID_FONT =
    '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';

  /** 窄视口（手机等）导出时使用的桌面级内容宽度 */
  const DESKTOP_EXPORT_WIDTH = 920;

  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    themeVariables: {
      primaryColor: "#e3f2fd",
      primaryTextColor: "#0d47a1",
      primaryBorderColor: "#1976d2",
      lineColor: "#5c6bc0",
      secondaryColor: "#fff3e0",
      secondaryTextColor: "#873800",
      secondaryBorderColor: "#f57c00",
      tertiaryColor: "#e8f5e9",
      tertiaryTextColor: "#135200",
      tertiaryBorderColor: "#388e3c",
      fontFamily: MERMAID_FONT,
      fontSize: "15px",
      edgeLabelBackground: "#ffffff",
    },
    flowchart: {
      curve: "basis",
      padding: 20,
      nodeSpacing: 50,
      rankSpacing: 60,
      useMaxWidth: true,
      htmlLabels: true,
    },
    sequence: {
      diagramMarginX: 20,
      diagramMarginY: 20,
      actorMargin: 60,
      messageMargin: 40,
      useMaxWidth: true,
    },
    gantt: { useMaxWidth: true },
    journey: { useMaxWidth: true },
    timeline: { useMaxWidth: true },
    class: { useMaxWidth: true },
    state: { useMaxWidth: true },
    er: { useMaxWidth: true },
    pie: { useMaxWidth: true },
    securityLevel: "loose",
  });

  const input = document.getElementById("markdown-input");
  const preview = document.getElementById("preview");
  const downloadBtn = document.getElementById("download-btn");
  const pdfBtn = document.getElementById("pdf-btn");
  const renderBtn = document.getElementById("render-btn");
  const statusEl = document.getElementById("status");

  input.value = DEFAULT_MARKDOWN;

  function setStatus(message) {
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  function highlightCodeBlocks(root) {
    if (typeof hljs === "undefined") {
      return;
    }
    root.querySelectorAll("pre code").forEach(function (block) {
      if (block.classList.contains("language-mermaid")) {
        return;
      }
      hljs.highlightElement(block);
    });
  }

  function wrapTables(root) {
    root.querySelectorAll("table").forEach(function (table) {
      if (
        table.parentElement &&
        table.parentElement.classList.contains("table-wrapper")
      ) {
        return;
      }
      const wrapper = document.createElement("div");
      wrapper.className = "table-wrapper";
      table.replaceWith(wrapper);
      wrapper.appendChild(table);
    });
  }

  function wrapMermaidBlocks(root) {
    root.querySelectorAll("pre > code.language-mermaid").forEach(function (block) {
      const pre = block.parentElement;
      if (!pre) {
        return;
      }
      const wrapper = document.createElement("div");
      wrapper.className = "mermaid-wrapper";
      pre.replaceWith(wrapper);
      wrapper.appendChild(block);
    });
  }

  /** 预览区正文可用宽度（扣除 #preview 内边距） */
  function getPreviewContentWidth(root) {
    const style = window.getComputedStyle(root);
    const padding =
      (parseFloat(style.paddingLeft) || 0) +
      (parseFloat(style.paddingRight) || 0);
    return Math.max(320, root.clientWidth - padding);
  }

  /** 渲染前让 Mermaid 容器占满预览宽度，便于按页面宽度布局 */
  function prepareMermaidContainers(root) {
    const contentWidth = getPreviewContentWidth(root);
    root.querySelectorAll(".mermaid-wrapper").forEach(function (wrapper) {
      wrapper.style.width = "100%";
      wrapper.style.maxWidth = contentWidth + "px";
    });
  }

  /** 渲染后将 SVG 缩放到容器像素宽度，避免小图被 CSS 拉伸导致模糊 */
  function fitMermaidSvgsToWidth(root) {
    const fallbackWidth = getPreviewContentWidth(root);
    root.querySelectorAll(".mermaid-wrapper").forEach(function (wrapper) {
      const svg = wrapper.querySelector("svg");
      if (!svg) {
        return;
      }

      const style = window.getComputedStyle(wrapper);
      const horizontalPadding =
        (parseFloat(style.paddingLeft) || 0) +
        (parseFloat(style.paddingRight) || 0);
      let available = wrapper.clientWidth - horizontalPadding;
      if (available <= 0) {
        available = fallbackWidth - horizontalPadding;
      }
      available = Math.max(280, available);

      resizeSvgToWidth(svg, available);
    });
  }

  function resizeSvgToWidth(svg, targetWidth) {
    const viewBox = svg.getAttribute("viewBox");
    if (!viewBox) {
      svg.setAttribute("width", String(targetWidth));
      svg.style.width = targetWidth + "px";
      svg.style.height = "auto";
      return;
    }

    const parts = viewBox.trim().split(/[\s,]+/).map(Number);
    if (parts.length < 4 || !parts[2] || !parts[3]) {
      return;
    }

    const vbWidth = parts[2];
    const vbHeight = parts[3];
    const targetHeight = Math.ceil((targetWidth * vbHeight) / vbWidth);

    svg.setAttribute("width", String(targetWidth));
    svg.setAttribute("height", String(targetHeight));
    svg.style.width = targetWidth + "px";
    svg.style.height = targetHeight + "px";
    svg.style.maxWidth = "100%";
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  }

  async function renderAll() {
    setStatus("正在渲染…");
    preview.innerHTML = marked.parse(input.value, { gfm: true, breaks: false });

    highlightCodeBlocks(preview);
    wrapTables(preview);
    wrapMermaidBlocks(preview);
    prepareMermaidContainers(preview);

    renderMathInElement(preview, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
      ],
      throwOnError: false,
    });

    const mermaidNodes = preview.querySelectorAll("code.language-mermaid");
    if (mermaidNodes.length) {
      await mermaid.run({ nodes: mermaidNodes });
      fitMermaidSvgsToWidth(preview);
    }

    setStatus("渲染完成");
  }

  function forceReflow(el) {
    const prev = el.style.display;
    el.style.display = "none";
    void el.offsetHeight;
    el.style.display = prev || "block";
  }

  function savePreviewLayout() {
    return {
      width: preview.style.width,
      maxWidth: preview.style.maxWidth,
      minWidth: preview.style.minWidth,
      boxSizing: preview.style.boxSizing,
    };
  }

  function pinPreviewLayout(width) {
    preview.style.width = width + "px";
    preview.style.maxWidth = width + "px";
    preview.style.minWidth = width + "px";
    preview.style.boxSizing = "border-box";
  }

  function restorePreviewLayout(saved) {
    preview.style.width = saved.width;
    preview.style.maxWidth = saved.maxWidth;
    preview.style.minWidth = saved.minWidth;
    preview.style.boxSizing = saved.boxSizing;
  }

  /**
   * 导出布局宽度：以当前预览区实际像素宽度为准；
   * 过窄（手机/极小 iframe）时改用桌面内容宽度，避免导出成手机窄条图。
   */
  function getExportLayoutWidth() {
    const measured = Math.round(preview.getBoundingClientRect().width);
    if (measured < 640) {
      return DESKTOP_EXPORT_WIDTH;
    }
    return measured;
  }

  async function capturePreviewCanvas() {
    const savedLayout = await prepareExportLayout();
    const exportWidth = getExportLayoutWidth();
    const exportHeight = Math.ceil(preview.scrollHeight);
    const scale = 2;

    try {
      return await html2canvas(preview, {
        backgroundColor: "#ffffff",
        scale: scale,
        width: exportWidth,
        height: exportHeight,
        windowWidth: exportWidth,
        windowHeight: exportHeight,
        useCORS: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        onclone: function (clonedDoc) {
          const style = clonedDoc.createElement("style");
          style.textContent =
            "#preview{width:" +
            exportWidth +
            "px!important;max-width:" +
            exportWidth +
            "px!important;min-width:" +
            exportWidth +
            "px!important;box-sizing:border-box!important;}";
          clonedDoc.head.appendChild(style);
        },
      });
    } finally {
      restorePreviewLayout(savedLayout);
      await renderAll();
    }
  }

  async function prepareExportLayout() {
    await renderAll();
    await document.fonts.ready;
    const savedLayout = savePreviewLayout();
    const exportWidth = getExportLayoutWidth();
    pinPreviewLayout(exportWidth);
    await renderAll();
    await document.fonts.ready;
    forceReflow(preview);
    return savedLayout;
  }

  async function exportPDF() {
    if (!pdfBtn) {
      return;
    }

    const originalText = pdfBtn.textContent;
    pdfBtn.disabled = true;
    downloadBtn.disabled = true;
    setStatus("正在准备 PDF…");

    let savedLayout = null;
    const originalTitle = document.title;

    function cleanup() {
      document.title = originalTitle;
      if (savedLayout) {
        restorePreviewLayout(savedLayout);
        renderAll();
      }
      pdfBtn.disabled = false;
      downloadBtn.disabled = false;
      pdfBtn.textContent = originalText;
      window.removeEventListener("afterprint", cleanup);
    }

    try {
      savedLayout = await prepareExportLayout();
      document.title = "markdown-document-" + Date.now();
      window.addEventListener("afterprint", cleanup);
      setStatus("请在对话框中选择「另存为 PDF」并开启「背景图形」");
      window.print();
    } catch (err) {
      console.error("PDF 导出失败:", err);
      setStatus("PDF 准备失败，请查看控制台");
      alert("PDF 导出失败：" + err.message);
      cleanup();
    }
  }

  let debounceTimer;
  input.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(renderAll, 500);
  });

  renderBtn.addEventListener("click", renderAll);

  if (pdfBtn) {
    pdfBtn.addEventListener("click", exportPDF);
  }

  downloadBtn.addEventListener("click", async function () {
    const originalText = downloadBtn.textContent;
    downloadBtn.textContent = "生成中…";
    downloadBtn.disabled = true;
    if (pdfBtn) {
      pdfBtn.disabled = true;
    }
    setStatus("正在生成图片…");

    try {
      setStatus(
        "正在生成图片（宽度 " + getExportLayoutWidth() + "px）…"
      );
      const canvas = await capturePreviewCanvas();

      const link = document.createElement("a");
      link.download = "markdown-export-" + Date.now() + ".png";
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
      setStatus("图片已下载");
    } catch (err) {
      console.error("截图失败:", err);
      setStatus("生成失败，请查看控制台");
      alert("生成图片失败：" + err.message);
    } finally {
      downloadBtn.textContent = originalText;
      downloadBtn.disabled = false;
      if (pdfBtn) {
        pdfBtn.disabled = false;
      }
    }
  });

  renderAll();

  if (typeof ResizeObserver !== "undefined") {
    let resizeTimer;
    const previewObserver = new ResizeObserver(function () {
      if (!preview.querySelector(".mermaid svg")) {
        return;
      }
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(renderAll, 300);
    });
    previewObserver.observe(preview);
  }
})();
