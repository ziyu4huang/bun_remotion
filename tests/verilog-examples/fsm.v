// Simple Moore FSM: traffic light controller
module traffic_light (
    input         clk,
    input         rst_n,
    output reg [1:0] light  // 00=red, 01=green, 10=yellow
);

    parameter RED    = 2'b00;
    parameter GREEN  = 2'b01;
    parameter YELLOW = 2'b10;

    // 5 clock cycles green, 2 yellow, 5 red
    function [2:0] next_state;
        input [1:0] state;
        input [2:0] timer;
        begin
            case (state)
                GREEN:  next_state = (timer == 3'd4) ? YELLOW : GREEN;
                YELLOW: next_state = RED;
                RED:    next_state = (timer == 3'd4) ? GREEN : RED;
                default: next_state = RED;
            endcase
        end
    endfunction

    reg [1:0] state;
    reg [2:0] timer;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= RED;
            timer <= 3'd0;
        end else begin
            state <= next_state(state, timer);
            timer <= (timer == 3'd4) ? 3'd0 : timer + 1;
        end
    end

    always @(*) begin
        light = state;
    end
endmodule
