
```c
double f(double a){
    static double a0=5;
    static double k1=0.3;
    static double k2=0.6;
    return a>a0?k1*(a-a0):k2*(a-a0);
}
```
$$
s(x,u)=\frac{1}{1+e^{-u x}}\\
\lim_{u \rightarrow \infty} f(x,u)=s(x,u)*k1*(x-a0)+(1-s(x,u))*k2*(x-a0)
$$
而$s(x,u)=\frac{1}{1+e^{-u x}}$如下图：

![$S(x,u)$](c.png "S(x,u)")