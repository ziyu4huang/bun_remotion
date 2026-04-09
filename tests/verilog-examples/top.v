// Top-level module: connects adder, counter, and mux together
module top_system (
    input         clk,
    input         rst_n,
    input         enable,
    input         sel,
    input  [7:0]  ext_a,
    input  [7:0]  ext_b,
    output [7:0]  result
);

    wire [7:0]  adder_sum;
    wire        adder_cout;
    wire [3:0]  counter_val;
    wire        counter_out;

    // Instantiate adder
    adder u_adder (
        .a(ext_a),
        .b(ext_b),
        .cin(1'b0),
        .sum(adder_sum),
        .cout(adder_cout)
    );

    // Instantiate counter
    counter u_counter (
        .clk(clk),
        .rst_n(rst_n),
        .enable(enable),
        .count(counter_val)
    );

    // Mux selects between adder output and counter output
    assign result = sel ? {4'b0000, counter_val} : adder_sum;

endmodule
