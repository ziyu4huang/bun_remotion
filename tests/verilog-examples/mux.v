// 2-to-1 multiplexer (dataflow style)
module mux2to1 (
    input  sel,
    input  a,
    input  b,
    output y
);
    assign y = sel ? b : a;
endmodule
