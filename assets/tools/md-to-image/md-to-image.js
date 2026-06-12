(function () {
  "use strict";

  const DEFAULT_MARKDOWN = `# Markdown 转图片

支持 **表格**、**LaTeX 公式** 与 **Mermaid 流程图**，在浏览器本地完成渲染与导出。

## 表格示例

| 能力 | 库 | 说明 |
| --- | --- | --- |
| Markdown | marked | 解析为 HTML |
| 公式 | KaTeX | 行内与块级 LaTeX |
| 图表 | Mermaid | 内联 SVG |
| 截图 | html2canvas | 导出 PNG |

## LaTeX

行内：质能方程 $E = mc^2$。

块级：
$$
\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}
$$

## Mermaid

\`\`\`mermaid
graph LR
  A[输入 Markdown] --> B[渲染预览]
  B --> C[导出 PNG]
\`\`\`
`;

  mermaid.initialize({
    startOnLoad: false,
    theme: "default",
    securityLevel: "loose",
  });

  const input = document.getElementById("markdown-input");
  const preview = document.getElementById("preview");
  const downloadBtn = document.getElementById("download-btn");
  const renderBtn = document.getElementById("render-btn");
  const statusEl = document.getElementById("status");

  input.value = DEFAULT_MARKDOWN;

  function setStatus(message) {
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  async function renderAll() {
    setStatus("正在渲染…");
    preview.innerHTML = marked.parse(input.value, { gfm: true, breaks: false });

    renderMathInElement(preview, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
      ],
      throwOnError: false,
    });

    const mermaidNodes = preview.querySelectorAll(
      "pre > code.language-mermaid, code.language-mermaid"
    );
    if (mermaidNodes.length) {
      await mermaid.run({ nodes: mermaidNodes });
    }

    setStatus("渲染完成");
  }

  let debounceTimer;
  input.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(renderAll, 500);
  });

  renderBtn.addEventListener("click", renderAll);

  downloadBtn.addEventListener("click", async function () {
    const originalText = downloadBtn.textContent;
    downloadBtn.textContent = "生成中…";
    downloadBtn.disabled = true;
    setStatus("正在生成图片…");

    try {
      await renderAll();
      await document.fonts.ready;

      const canvas = await html2canvas(preview, {
        backgroundColor: "#ffffff",
        scale: Math.max(2, window.devicePixelRatio || 1),
        useCORS: true,
        logging: false,
        windowWidth: preview.scrollWidth,
        windowHeight: preview.scrollHeight,
      });

      const link = document.createElement("a");
      link.download = "markdown-export-" + Date.now() + ".png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      setStatus("图片已下载");
    } catch (err) {
      console.error("截图失败:", err);
      setStatus("生成失败，请查看控制台");
      alert("生成图片失败：" + err.message);
    } finally {
      downloadBtn.textContent = originalText;
      downloadBtn.disabled = false;
    }
  });

  renderAll();
})();
