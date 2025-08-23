import os
import json

CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'analytics_config.json')
ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')

OPTIONS = [
    'Sentry',
    'Nightwatch',
    'Both',
    'None (not recommended)'
]

REQUIRED_ENV = {
    'Sentry': ['SENTRY_DSN'],
    'Nightwatch': ['NIGHTWATCH_API_URL', 'NIGHTWATCH_API_KEY'],
    'Both': ['SENTRY_DSN', 'NIGHTWATCH_API_URL', 'NIGHTWATCH_API_KEY']
}

def prompt_choice():
    print('Choose analytics integration:')
    for i, opt in enumerate(OPTIONS, 1):
        print(f'{i}. {opt}')
    while True:
        try:
            choice = int(input('Enter option number: '))
            if 1 <= choice <= len(OPTIONS):
                return OPTIONS[choice-1]
        except Exception:
            pass
        print('Invalid choice, try again.')

def prompt_env_vars(required):
    env = {}
    for var in required:
        env[var] = input(f'Enter value for {var}: ')
    return env

def write_env(env_vars):
    lines = []
    if os.path.exists(ENV_PATH):
        with open(ENV_PATH) as f:
            lines = f.readlines()
    env_dict = dict(line.strip().split('=', 1) for line in lines if '=' in line)
    env_dict.update(env_vars)
    with open(ENV_PATH, 'w') as f:
        for k, v in env_dict.items():
            f.write(f'{k}={v}\n')
    for k, v in env_vars.items():
        os.environ[k] = v

def write_config(option):
    with open(CONFIG_PATH, 'w') as f:
        json.dump({'analytics': option}, f)

def main():
    option = prompt_choice()
    if option != 'None (not recommended)':
        env_vars = prompt_env_vars(REQUIRED_ENV[option])
        write_env(env_vars)
    write_config(option)
    print(f'Analytics option "{option}" saved to {CONFIG_PATH}')
    print('.env updated.')

if __name__ == '__main__':
    main()