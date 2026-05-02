#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/*
 * Core Tic Tac Toe Logic in C
 * Uses a 3x3 2D array to manage game state.
 * Supports dual modes:
 * - Interactive Terminal mode (Run directly without arguments)
 * - Web API mode (Arguments provided: <board> <symbol> <move>)
 */

void init_board(char board[3][3]) {
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 3; j++) {
            board[i][j] = ' ';
        }
    }
}

void parse_board(char board[3][3], const char *str) {
    int k = 0;
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 3; j++) {
            board[i][j] = str[k++];
        }
    }
}

void board_to_string(char board[3][3], char *str) {
    int k = 0;
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 3; j++) {
            str[k++] = board[i][j];
        }
    }
    str[k] = '\0';
}

int check_win(char board[3][3], char symbol) {
    // Row checks
    for (int i = 0; i < 3; i++) {
        if (board[i][0] == symbol && board[i][1] == symbol && board[i][2] == symbol)
            return 1;
    }
    // Column checks
    for (int i = 0; i < 3; i++) {
        if (board[0][i] == symbol && board[1][i] == symbol && board[2][i] == symbol)
            return 1;
    }
    // Diagonal checks
    if (board[0][0] == symbol && board[1][1] == symbol && board[2][2] == symbol)
        return 1;
    if (board[0][2] == symbol && board[1][1] == symbol && board[2][0] == symbol)
        return 1;

    return 0;
}

int check_draw(char board[3][3]) {
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 3; j++) {
            if (board[i][j] == ' ')
                return 0;
        }
    }
    return 1;
}

void print_board_cli(char board[3][3]) {
    printf("\n");
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 3; j++) {
            if (board[i][j] == ' ') {
                printf(" %d ", i * 3 + j + 1);
            } else {
                printf(" %c ", board[i][j]);
            }
            if (j < 2) printf("|");
        }
        printf("\n");
        if (i < 2) printf("---|---|---\n");
    }
    printf("\n");
}

int main(int argc, char *argv[]) {
    // If command line arguments are provided, switch to Web API Mode.
    if (argc >= 4) {
        char board[3][3];
        char updated_board_str[10];
        
        const char *board_str = argv[1];
        char symbol = argv[2][0];
        int move_pos = atoi(argv[3]);
        
        // Ensure inputs are valid
        if (strlen(board_str) != 9 || (symbol != 'X' && symbol != 'O') || move_pos < 0 || move_pos > 8) {
            printf("{\"valid\":0, \"msg\":\"Invalid input parameters.\"}\n");
            return 0;
        }
        
        parse_board(board, board_str);
        
        int row = move_pos / 3;
        int col = move_pos % 3;
        
        if (board[row][col] != ' ') {
            printf("{\"valid\":0, \"msg\":\"Cell is already taken.\"}\n");
            return 0;
        }
        
        // Set symbol at targeted cell
        board[row][col] = symbol;
        board_to_string(board, updated_board_str);
        
        int win = check_win(board, symbol);
        int draw = check_draw(board);
        
        // Print outcome as JSON string
        printf("{\"valid\":1, \"board\":\"%s\", \"win\":%d, \"draw\":%d, \"msg\":\"Move processed successfully.\"}\n",
               updated_board_str, win, win ? 0 : draw);
               
        return 0;
    }
    
    // Terminal/CLI Mode
    char board[3][3];
    char p1_name[50], p2_name[50];
    char play_again;
    
    printf("=== Welcome to Tic Tac Toe in C ===\n\n");
    printf("Enter Player 1 (X) Name: ");
    if (fgets(p1_name, sizeof(p1_name), stdin)) {
        p1_name[strcspn(p1_name, "\n")] = '\0';
    }
    printf("Enter Player 2 (O) Name: ");
    if (fgets(p2_name, sizeof(p2_name), stdin)) {
        p2_name[strcspn(p2_name, "\n")] = '\0';
    }
    
    do {
        init_board(board);
        int turns = 0;
        int game_over = 0;
        char current_symbol = 'X';
        char *current_name = p1_name;
        
        while (!game_over) {
            print_board_cli(board);
            printf("%s's Turn (%c). Choose empty position (1-9): ", current_name, current_symbol);
            
            int move = -1;
            if (scanf("%d", &move) != 1) {
                // Clear the input buffer if user entered invalid input
                while (getchar() != '\n');
                printf("Invalid input. Please enter a number between 1 and 9.\n");
                continue;
            }
            
            if (move < 1 || move > 9) {
                printf("Number must be between 1 and 9.\n");
                continue;
            }
            
            int row = (move - 1) / 3;
            int col = (move - 1) % 3;
            
            if (board[row][col] != ' ') {
                printf("That spot is already occupied. Choose another spot.\n");
                continue;
            }
            
            board[row][col] = current_symbol;
            turns++;
            
            if (check_win(board, current_symbol)) {
                print_board_cli(board);
                printf("=== Game Over ===\n");
                printf("Congratulations! %s (%c) won the game!\n", current_name, current_symbol);
                game_over = 1;
            } else if (check_draw(board)) {
                print_board_cli(board);
                printf("=== Game Over ===\n");
                printf("The game is a draw!\n");
                game_over = 1;
            } else {
                // Switch players
                if (current_symbol == 'X') {
                    current_symbol = 'O';
                    current_name = p2_name;
                } else {
                    current_symbol = 'X';
                    current_name = p1_name;
                }
            }
        }
        
        printf("\nDo you want to play again? (y/n): ");
        scanf(" %c", &play_again);
        
    } while (play_again == 'y' || play_again == 'Y');
    
    printf("\nThank you for playing Tic Tac Toe!\n");
    return 0;
}
