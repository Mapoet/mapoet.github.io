---
permalink: /
title: "Mapoet Niphy, Ph.D. candidate, Astronomical Measurement and Celestial Mechanics"
excerpt: "About me"
author_profile: true
redirect_from: 
  - /about/
  - /about.html
---

- Introducing the DCBs of receivers and transmitters

The Center for Orbit Determination in Europe (CODE) and other research institutes obtain the solution DCB based on the single-layer ionospheric hypothesis; however, the top region of the ionosphere is affected by magnetic storms and possesses a complex spatial environment. The resulting errors are transmitted mainly to the absolute slant total electron content (STEC). The root mean square (RMS) DCBs of GNSS stations solved by the CODE/IGS institutions and the DCBs of the GPS/LEO observations in the podTec data from COSMIC used to estimate the errors of the DCBs were added to the background field of the ionosphere to obtain the STEC error. Accordingly, the STEC error was suppressed during assimilation.

The following observational equation was employed for additional electron density observations:
    
$\begin{bmatrix}h_{i,j}&\delta^T_i&\delta^R_i \\\ \delta_{k,j}&O&O\end{bmatrix}\begin{bmatrix}ne_j \\\ DCB^T \\\ DCB^R\end{bmatrix}=\begin{bmatrix}{STEC}_i \\\ ne_k \end{bmatrix}$

where $h_{i,j}$ is the projection matrix obtained by ray tracing for ground-based/spaceborne observations;
$\delta^T_i$,$\delta^R_i$ are the DCB coefficients of the transmitters and receivers;
$\delta_{k,j}$ is the coefficient of the $j$th grid for the $k$th electron density observation data point; $NE_j$ is the electron density of the $j$ grid;
$\Delta DCB^T, \Delta DCB^R$are the assimilated DCB differences between the DCBs of the transmitters and receivers and the CODE transmitter and receiver DCBs, respectively; and $STEC_j, NE_k$ are the observed STEC values obtained through the CODE/IGS products and the electron densities, respectively.

The model error can be written as:

$O_m=\begin{bmatrix}O_{ne_j^b}&O&O \\\ O&O_{DCB_T^b}&O \\\ O&O&O_{DCB_R^b}\end{bmatrix}$
        
The DCBs error was determined by the RMS of the IGS/CODE DCB product:

$O_{DCB_T^b}=(9.52C \times RMS_{DCB_T}10^{-9})^2$

$O_{DCB_R^b}=(9.52C \times RMS_{DCB_R}10^{-9})^2$
        
where $O_{DCB_T^b},O_{DCB_R^b}$ is DCBs error of transmitters and receivers,respectively; $C$ is lightspeed; $RMS_{DCB_T}, RMS_{DCB_R}$ is
DCBs RMS of transmitters and receivers from CODE DCB product, respectively.

If electron density observation data were introduced during the assimilation process, then:

$O_{ne_k}=\tau^2$

where $O_{ne^f_k}$ is the error of electron density observation data, and $\tau$ is a fixed value representing the electron density error.

Finally, we can obtain the ionospheric update equation considering the effects of DCBs.


For more info
------
More info about configuring academicpages can be found in [the guide](https://academicpages.github.io/markdown/). The [guides for the Minimal Mistakes theme](https://mmistakes.github.io/minimal-mistakes/docs/configuration/) (which this theme was forked from) might also be helpful.
