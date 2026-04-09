// 3-to-8 decoder with enable
module decoder_3to8 (
    input       en,
    input [2:0] in,
    output reg [7:0] out
);
    always @(*) begin
        if (en)
            out = 8'b00000001 << in;
        else
            out = 8'b00000000;
    end
endmodule
