// 4-bit shift register with parallel load
module shift_register (
    input         clk,
    input         rst_n,
    input         load,
    input  [3:0]  data_in,
    input         shift_in,
    output reg [3:0] data_out
);
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            data_out <= 4'b0000;
        else if (load)
            data_out <= data_in;
        else
            data_out <= {data_out[2:0], shift_in};
    end
endmodule
