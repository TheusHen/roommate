import os
from dotenv import load_dotenv

REQUIRED_ENV_VARS = [
    "NODE_ENV",
    "MONGO_URI"
]

ENV_PATH = os.path.join(os.path.dirname(__file__), "../.env")

def prompt_env_vars():
    env_vars = {}
    for var in REQUIRED_ENV_VARS:
        value = input(f"Enter value for {var}: ")
        env_vars[var] = value
    return env_vars

def save_env_vars(env_vars):
    with open(ENV_PATH, "w") as f:
        for key, value in env_vars.items():
            f.write(f"{key}={value}\n")
    print(f"[INFO] .env file saved at {ENV_PATH}")

if __name__ == "__main__":
    print("--- Environment Variable Setup ---")
    env_vars = prompt_env_vars()
    save_env_vars(env_vars)
