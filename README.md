# offline-recovery-tool-public

## Performing recovery of Wallet private keys

### Step 1: Install Node.js (npm)

Visit https://nodejs.org/en
Click the big green button that says "Download" (it will automatically select the right version for your computer)
Once downloaded, open the file and follow the installation prompts

### Step 2: Download and Extract the Offline Recovery Tool

Download the tool from [GitHub](https://github.com/horcrux01/offline-recovery-tool-public/blob/main/offline-recovery-tool-public.zip) 

<img width="479" alt="image" src="https://github.com/user-attachments/assets/68d62caf-852b-4271-8e7a-f32cd22a2ae7" />

Once downloaded, find the file in your Downloads folder
Right-click on the file and select "Extract All" (Windows) or double-click the file (Mac) to unzip

### Step 3: Open Terminal
For Windows:

Press the `Windows key + R`
Type `cmd` and press Enter
This will open the Command Prompt window

For Mac:

Press `Command + Space` to open Spotlight Search
Type "Terminal" and press Enter
This will open the Terminal application

### Step 4: Navigate to the Downloads Folder
For Windows:

In the Command Prompt, type: `cd %USERPROFILE%\Downloads` and press Enter

For Mac:

In the Terminal, type: `cd ~/Downloads` and press Enter

### Step 5: Verify npm Installation

Type `npm -v` and press Enter
You should see a version number like "10.8.2"
If you don't see a version number, npm may not be installed correctly

### Step 6: Go to the Tool Folder

Type `cd offline-recovery-tool-public` and press Enter

### Step 7: Install Yarn

Type `npm install --global yarn` and press Enter
Wait for installation to complete

### Step 8: Verify Yarn Installation

Type `yarn --version` and press Enter
You should see a version number like "10.8.2"

### Step 9: Install Dependencies

Type `yarn install` and press Enter
This might take a few minutes to complete

### Step 10: Run the Tool

Type `yarn run dev &` and press Enter

The tool will automatically open in your web browser at http://localhost:5173/
If it doesn't open automatically, open your browser and type that address in the address bar

## Creating Transactions for EdDSA based blockchains

### Near

To send tokens with our NEAR wallet script, simply run the following in your terminal:

`npx tsx src/recoveryTransaction/near.ts <sender> <receiver> <privateKeyHex> <amount> [tokenContractId])`
 
This uses ts-node to compile and execute the transfer script at src/index.ts. Arguments:

sender: your PV wallet’s NEAR account ID

receiver: recipient’s NEAR account

privateKeyHex: hex key from the recovery process

amount: number of tokens to transfer in minimal units

tokenContractId (optional): NEAR contract ID for fungible tokens; skip for native NEAR 

Example: transfer USDC from `8fa58e9a13ee47fb74106d565f6c500f6f5b881a7085adc443800204a63f21a1` to `receiver.near` (USDC contract ID `17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1`):
 
`npx tsx src/recoveryTransaction/near.ts 8fa58e9a13ee47fb74106d565f6c500f6f5b881a7085adc443800204a63f21a1 receiver.near 01213213213213213213213 10000000 17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1`
