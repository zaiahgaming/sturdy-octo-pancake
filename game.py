import random

def main():
    print('Welcome to the number guessing game!')
    play_again = 'y'
    score = 0
    max_attempts = 3
    while play_again.lower() == 'y':
        number_to_guess = random.randint(1, 10)
        attempts = 0
        guessed = False
        while attempts < max_attempts and not guessed:
            guess = int(input(f'Guess a number between 1 and 10 (Attempt {attempts+1}/{max_attempts}): '))
            attempts += 1
            if guess == number_to_guess:
                print('Congratulations! You guessed the correct number.')
                score += 1
                guessed = True
            elif attempts < max_attempts:
                print('Try again!')
            else:
                print(f'Sorry, you ran out of attempts. The correct number was {number_to_guess}.')
        play_again = input('Would you like to play again? (y/n): ')
    print(f'Game over! Your final score is {score}.')

if __name__ == '__main__':
    main()