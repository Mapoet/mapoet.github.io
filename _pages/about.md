---
permalink: /
title: "Mapoet Niphy, Ph.D. candidate, Astronomical Measurement and Celestial Mechanics"
excerpt: "About me"
author_profile: true
redirect_from: 
  - /about/
  - /about.html
---

- 引入接收机及发射机的DCB误差

由于CODE及一般研究机构基于单层电离层假设获得解算DCB，然而我们知道，在顶部区域电离层电离层受到的磁暴及复杂空间环境影响更大，由此产生的误差主要部分传递到了绝对STEC。为此，以COSMIC产品podTec中GPS/LEO的DCB解算的RMS或CODE/IGS机构的DCB解算的RMS作为DCBs的误差评估，附加到背景场电离层获得STEC误差，进而绝对STEC误差同化过程中便可以通过DCBs误差获得抑制。  
    
以下是附加电子密度观测数据的观测方程：
    
$\begin{bmatrix}h_{i,j}&\delta^T_i&\delta^R_i \\\ \delta_{k,j}&O&O\end{bmatrix}\begin{bmatrix}{NE}_j \\\ DCB^T \\\ DCB^R\end{bmatrix}=\begin{bmatrix}{STEC}_i \\\ {NE}_k \end{bmatrix}$

其中 $h_{i,j}$为地基/空基观测数据通过射线追踪获得的投影矩阵；$\delta^T_i,\delta^R_i,\delta_{k,j}$为不同观测量发射机、接收机的DCB系数；$NE_j$为第$j$个格网的电子密度；$DCB^T,DCB^R$为发射机及接收机$DCB$；$STEC_j,NE_k$为同化观测数据及电子密度。

模型误差可以写成：

$O_m=\begin{bmatrix}O_{ne_j^b}&O&O \\\ O&O_{DCB_T^b}&O \\\ O&O&O_{DCB_R^b}\end{bmatrix}$
        
 其中DCBs误差由IGS/CODE的DCBs产品RMS决定：

$O_{DCB_T^b}=(9.52C \times RMS_{DCB_T}10^{-9})^2$

$O_{DCB_R^b}=(9.52C \times RMS_{DCB_R}10^{-9})^2$
        
如果同化过程中引入电子密度观测数据，则令：

$O_{ne_k}=\tau^2$

最终我们可以获得包含DCB影响的电离层更新方程：

$\begin{bmatrix}\Delta {NE}_j \\\ \Delta DCB^T \\\ \Delta DCB^R\end{bmatrix}=\alpha^2 {\begin{bmatrix}h_{i,j}O_{ne_j^b}\delta^T_i O_{DCB_T^b}&\delta^R_i O_{DCB_R^b} \\\ \delta_{k,j}O_{ne_j^b}&O&O\end{bmatrix}}^T \\\ \left(\alpha^2 \begin{bmatrix}h_{i,j}O_{ne_j^b}{h_{i,j}}^T+\delta^T_i O_{DCB^T_b}{\delta^T_i}^T+\delta^R_i O_{DCB_R^b}{\delta^R_i}^T&h_{i,j}O_{ne_j^b}\delta_{k,j}^T \\\ \delta_{k,j}O_{ne_j^b}h_{i,j}^T&\delta_{k,j}O_{ne_j^b} \delta_{k,j}^T\end{bmatrix} +(1-\alpha^2)\begin{bmatrix}O_{obs_i}&O \\\ O&O_{ne_k}\end{bmatrix}\right)^{-1} \\\ \left(\begin{bmatrix}{STEC}_i \\\ {NE}_k\end{bmatrix}-\begin{bmatrix}h_{i,j}&\delta^T_i&\delta^R_i \\\ \delta_{k,j}&O&O\end{bmatrix}\begin{bmatrix}{NE}_j \\\ DCB^T \\\ DCB^R\end{bmatrix}\right)$


For more info
------
More info about configuring academicpages can be found in [the guide](https://academicpages.github.io/markdown/). The [guides for the Minimal Mistakes theme](https://mmistakes.github.io/minimal-mistakes/docs/configuration/) (which this theme was forked from) might also be helpful.
