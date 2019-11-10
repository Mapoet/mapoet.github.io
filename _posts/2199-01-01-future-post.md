---
title: 'Future Blog Post'
date: 2199-01-01
permalink: /posts/2199/01/future-post
tags:
  - Programing
  - Visualization
  - Artificial Intelligence
---

进而，GPS在电离层传播过程中，$\delta_{iono}$有以下关系

<span id="pgtec"></span>

$${\delta_{iono}}_{j,k}^{P,i}=\int_{\Delta t}\nu_gdt-\rho_{j,k}=C \Delta t-\rho_{j,k}-\frac{40.28}{{f^i}^2}\int_{\Delta t} n_e dt=n^P-\frac{40.28}{{f^i}^2}\int_{\Delta t} n_e dt$$

$${\delta_{iono}}_{j,k}^{\phi,i}=\int_{\Delta t}\nu_pdt-\rho_{j,k}=C \Delta t-\rho_{j,k}+\frac{40.28}{{f^i}^2}\int_{\Delta t} n_e dt=n^\phi+\frac{40.28}{{f^i}^2}\int_{\Delta t} n_e dt$$

令

<span id="tec"></span>

$$TEC_{j,k}=\int^{X_j}_{X_k} n_e ds$$

则由[电离层对载波及相位的影响](#pgtec)通过观察[电离层误差方程](#modelobs)，可以通过双频线性组合的方式获得：

<span id="tec"></span>

$$TEC^P_{j,k}=\frac{{f^1}^2{f^2}^2}{40.28({f^1}^2-{f^2}^2)}[n^{P,2}_{j,k}-n^{P,1}_{j,k} + C \delta d_j - C \delta d_k - \delta m_{j,k} -\delta \varepsilon_{j,k} ]$$

$$TEC^\phi_{j,k}=\frac{{f^1}^2{f^2}^2}{40.28({f^1}^2-{f^2}^2)}[\phi^1(N^{\phi,1}_{j,k}+n^{\phi,1}_{j,k})-\phi^2(N^{\phi,2}_{j,k}-n^{\phi,2}_{j,k}) - C \delta d_j + C \delta d_k + \delta m_{j,k} + \delta \varepsilon_{j,k}]$$

For more interesting games or algorithms, check out "[Mapoet's GitHub](https://github.com/Mapoet)" or check out the starred projects...