import random

def main():
    print('Welcome to the number guessing game!')
    number_to_guess = random.randint(1, 10)
    guess = int(input('Guess a number between 1 and 10: '))
    if guess == number_to_guess:
        print('Congratulations! You guessed the correct number.')
    else:
        print(f'Sorry, the correct number was {number_to_guess}.')

if __name__ == '__main__':
    main()