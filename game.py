import random
import json
from high_score import load_high_score, save_high_score, update_high_score

def display_high_score():
    high_score = load_high_score()
    print(f'Current high score: {high_score}')

def main():
    print('Welcome to the number guessing game!')
    play_again = 'y'
    score = 0
    max_attempts = 3
    high_score = load_high_score()
    while play_again.lower() == 'y':
        number_to_guess = random.randint(1, 10)
        attempts = 0
        guessed = False
        while attempts < max_attempts and not guessed:
            try:
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
            except ValueError:
                print('Invalid input. Please enter a number.')
                attempts -= 1
        play_again = input('Would you like to play again? (y/n): ')
    print(f'Game over! Your final score is {score}.')
    high_score = update_high_score(score)
    print(f'High score: {high_score}')

def menu():
    while True:
        print('\nMenu:')
        print('1. Play game')
        print('2. View high score')
        print('3. Quit')
        choice = input('Enter your choice: ')
        if choice == '1':
            main()
        elif choice == '2':
            display_high_score()
        elif choice == '3':
            break
        else:
            print('Invalid choice. Please try again.')

if __name__ == '__main__':
    menu()