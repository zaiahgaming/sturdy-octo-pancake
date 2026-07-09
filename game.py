import random

def main():
    print('Welcome to the number guessing game!')
    play_again = 'y'
    score = 0
    while play_again.lower() == 'y':
        number_to_guess = random.randint(1, 10)
        guess = int(input('Guess a number between 1 and 10: '))
        if guess == number_to_guess:
            print('Congratulations! You guessed the correct number.')
            score += 1
        else:
            print(f'Sorry, the correct number was {number_to_guess}.')
        play_again = input('Would you like to play again? (y/n): ')
    print(f'Game over! Your final score is {score}.')

if __name__ == '__main__':
    main()