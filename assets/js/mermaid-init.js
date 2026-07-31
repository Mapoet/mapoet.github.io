/**
 * Mermaid 初始化与主题配置
 * 视觉方向：学术站点青灰主色（对齐 $info-color / $primary-color），
 * 纸面卡片容器 + 柔和节点，避免默认主题的廉价感与暗色 invert 失真。
 */
(function () {
  "use strict";

  var FONT =
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", Helvetica, Arial, sans-serif';

  /** 浅色学术主题变量 */
  var LIGHT_THEME = {
    darkMode: false,
    background: "transparent",
    mainBkg: "#eef5f8",
    primaryColor: "#e8f4f8",
    primaryTextColor: "#243447",
    primaryBorderColor: "#5a9bb0",
    secondaryColor: "#f3f6f8",
    secondaryTextColor: "#3a4a58",
    secondaryBorderColor: "#8a9ba8",
    tertiaryColor: "#fafbfc",
    tertiaryTextColor: "#4a5568",
    tertiaryBorderColor: "#c5d0d8",
    lineColor: "#6b7c8a",
    textColor: "#243447",
    titleColor: "#1a2a3a",
    nodeBorder: "#5a9bb0",
    nodeTextColor: "#243447",
    clusterBkg: "#f7fafb",
    clusterBorder: "#c5d4dc",
    defaultLinkColor: "#6b7c8a",
    edgeLabelBackground: "#ffffff",
    labelBackground: "#ffffff",
    labelTextColor: "#243447",
    fontFamily: FONT,
    fontSize: "15px",

    /* 流程图决策节点等 */
    altBackground: "#f0f4f6",

    /* 序列图 */
    actorBkg: "#e8f4f8",
    actorBorder: "#5a9bb0",
    actorTextColor: "#243447",
    actorLineColor: "#8a9ba8",
    signalColor: "#3a4a58",
    signalTextColor: "#243447",
    labelBoxBkgColor: "#eef5f8",
    labelBoxBorderColor: "#5a9bb0",
    labelTextColor: "#243447",
    loopTextColor: "#3a4a58",
    noteBkgColor: "#fbf6ee",
    noteTextColor: "#5c4a32",
    noteBorderColor: "#d4b896",
    activationBkgColor: "#d6eaf0",
    activationBorderColor: "#52adc8",
    sequenceNumberColor: "#ffffff",

    /* 状态图 */
    labelColor: "#243447",

    /* 甘特 */
    gridColor: "#e2e8ee",
    doneTaskBkgColor: "#c5dce4",
    doneTaskBorderColor: "#5a9bb0",
    activeTaskBkgColor: "#52adc8",
    activeTaskBorderColor: "#3d7a8c",
    critBkgColor: "#e8b4b0",
    critBorderColor: "#c75c56",
    taskBkgColor: "#eef5f8",
    taskBorderColor: "#8a9ba8",
    taskTextColor: "#243447",
    taskTextDarkColor: "#243447",
    taskTextOutsideColor: "#243447",
    taskTextLightColor: "#ffffff",
    sectionBkgColor: "#f3f6f8",
    sectionBkgColor2: "#eef5f8",
    todayLineColor: "#52adc8",

    /* 饼图：青灰系，避免高饱和彩虹 */
    pie1: "#52adc8",
    pie2: "#6b8f9e",
    pie3: "#8a9ba8",
    pie4: "#a8c5ce",
    pie5: "#3d7a8c",
    pie6: "#c5d4dc",
    pie7: "#7a9eab",
    pie8: "#4a6b75",
    pie9: "#9eb8c2",
    pie10: "#2c5a66",
    pie11: "#b8ced6",
    pie12: "#5a8794",
    pieTitleTextSize: "18px",
    pieTitleTextColor: "#1a2a3a",
    pieSectionTextSize: "13px",
    pieSectionTextColor: "#243447",
    pieLegendTextSize: "13px",
    pieLegendTextColor: "#3a4a58",
    pieStrokeColor: "#ffffff",
    pieStrokeWidth: "1.5px",
    pieOuterStrokeWidth: "1.5px",
    pieOuterStrokeColor: "#c5d4dc",
    pieOpacity: "0.92",

    /* Git 图 */
    git0: "#52adc8",
    git1: "#6b8f9e",
    git2: "#8a9ba8",
    git3: "#3d7a8c",
    git4: "#7a9eab",
    git5: "#4a6b75",
    git6: "#a8c5ce",
    git7: "#2c5a66",
    gitInv0: "#ffffff",
    gitInv1: "#ffffff",
    gitInv2: "#ffffff",
    gitInv3: "#ffffff",
    gitInv4: "#ffffff",
    gitInv5: "#ffffff",
    gitInv6: "#243447",
    gitInv7: "#ffffff",
    gitBranchLabel0: "#ffffff",
    gitBranchLabel1: "#ffffff",
    gitBranchLabel2: "#ffffff",
    gitBranchLabel3: "#ffffff",
    gitBranchLabel4: "#ffffff",
    gitBranchLabel5: "#ffffff",
    gitBranchLabel6: "#243447",
    gitBranchLabel7: "#ffffff",
    commitLabelColor: "#243447",
    commitLabelBackground: "#eef5f8",
    commitLabelFontSize: "12px",
    tagLabelColor: "#243447",
    tagLabelBackground: "#fbf6ee",
    tagLabelBorder: "#d4b896",
  };

  function decodeHtml(html) {
    var textarea = document.createElement("textarea");
    textarea.innerHTML = html;
    return textarea.value;
  }

  function convertCodeBlocks() {
    var blocks = document.querySelectorAll("pre > code.language-mermaid");
    var nodes = [];

    blocks.forEach(function (codeBlock) {
      var mermaidDiv = document.createElement("div");
      mermaidDiv.className = "mermaid";
      mermaidDiv.textContent = decodeHtml(codeBlock.textContent);

      var preBlock = codeBlock.parentElement;
      if (preBlock && preBlock.parentNode) {
        preBlock.parentNode.replaceChild(mermaidDiv, preBlock);
        nodes.push(mermaidDiv);
      }
    });

    return nodes;
  }

  function initMermaid() {
    if (typeof mermaid === "undefined") {
      return;
    }

    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      themeVariables: LIGHT_THEME,
      securityLevel: "loose",
      fontFamily: FONT,
      logLevel: "error",
      flowchart: {
        titleTopMargin: 16,
        diagramPadding: 16,
        htmlLabels: true,
        nodeSpacing: 48,
        rankSpacing: 52,
        curve: "basis",
        padding: 16,
        useMaxWidth: true,
        wrappingWidth: 220,
      },
      sequence: {
        diagramMarginX: 24,
        diagramMarginY: 20,
        actorMargin: 64,
        width: 160,
        height: 54,
        boxMargin: 12,
        boxTextMargin: 8,
        noteMargin: 12,
        messageMargin: 40,
        mirrorActors: true,
        bottomMarginAdj: 8,
        useMaxWidth: true,
        rightAngles: false,
        showSequenceNumbers: false,
        actorFontSize: 14,
        actorFontFamily: FONT,
        noteFontSize: 13,
        noteFontFamily: FONT,
        messageFontSize: 13,
        messageFontFamily: FONT,
      },
      gantt: {
        titleTopMargin: 20,
        barHeight: 22,
        barGap: 6,
        topPadding: 44,
        leftPadding: 80,
        gridLineStartPadding: 36,
        fontSize: 13,
        sectionFontSize: 14,
        numberSectionStyles: 2,
        useMaxWidth: true,
      },
      journey: {
        useMaxWidth: true,
        diagramMarginX: 24,
        diagramMarginY: 20,
      },
      pie: {
        useMaxWidth: true,
        textPosition: 0.75,
      },
      er: {
        useMaxWidth: true,
        diagramPadding: 20,
        layoutDirection: "TB",
        minEntityWidth: 100,
        minEntityHeight: 75,
        entityPadding: 16,
        fill: "#eef5f8",
        fontSize: 13,
      },
      class: {
        useMaxWidth: true,
        htmlLabels: true,
      },
      state: {
        useMaxWidth: true,
      },
      gitGraph: {
        useMaxWidth: true,
        mainBranchName: "main",
        showCommitLabel: true,
        showBranches: true,
      },
      timeline: {
        useMaxWidth: true,
        diagramMarginX: 24,
        diagramMarginY: 20,
      },
      mindmap: {
        useMaxWidth: true,
        padding: 16,
      },
      quadrantChart: {
        useMaxWidth: true,
      },
      xyChart: {
        useMaxWidth: true,
      },
      themeCSS: [
        ".label foreignObject { overflow: visible; }",
        ".node rect, .node circle, .node ellipse, .node polygon, .node path { stroke-width: 1.5px; }",
        ".edgePath .path { stroke-width: 1.6px; }",
        ".cluster rect { rx: 10px; ry: 10px; stroke-width: 1.25px; }",
        ".actor { stroke-width: 1.5px; }",
        ".messageLine0, .messageLine1 { stroke-width: 1.5px; }",
        ".note { stroke-width: 1.25px; }",
        "text.actor > tspan { font-weight: 600; }",
        ".pieTitleText { font-weight: 600; }",
        ".sectionTitle { font-weight: 600; }",
        ".titleText { font-weight: 600; letter-spacing: 0.02em; }",
      ].join("\n"),
    });

    var converted = convertCodeBlocks();
    var existing = Array.prototype.slice.call(
      document.querySelectorAll("div.mermaid:not([data-processed])")
    );
    var nodes = converted.concat(existing);

    if (!nodes.length) {
      return;
    }

    mermaid
      .run({ nodes: nodes })
      .catch(function (err) {
        if (typeof console !== "undefined" && console.warn) {
          console.warn("[mermaid]", err);
        }
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMermaid);
  } else {
    initMermaid();
  }
})();
