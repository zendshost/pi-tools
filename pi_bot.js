// pi_bot.js

const StellarSdk = require('stellar-sdk');
const bip39 = require('bip39');
const fs = require('fs');
const path = require('path');

// --- Konfigurasi Jaringan Pi ---
const PI_NETWORK_PASSPHRASE = "Pi Network";
const PI_HORIZON_URL = "https://api.mainnet.minepi.com";
// PERBAIKAN: Menggunakan constructor Server yang baru
const server = new StellarSdk.Server(PI_HORIZON_URL, { allowHttp: true });

/**
 * ==========================================================
 * PERINGATAN KEAMANAN (SECURITY WARNING)
 * ==========================================================
 * Skrip ini akan menangani kunci rahasia (secret key) dan frasa mnemonik.
 * Pastikan Anda menjalankan skrip ini di lingkungan yang aman.
 * JANGAN PERNAH membagikan secret key atau mnemonik Anda kepada siapapun.
 * ==========================================================
 */

// --- FUNGSI-FUNGSI INTI ---

/**
 * Membuat dompet Pi baru dan menyimpannya ke file.
 * @returns {object} Objek berisi mnemonic, publicKey, dan secretKey.
 */
function generateWallet() {
  console.log("Membuat dompet Pi baru...");
  try {
    const mnemonic = bip39.generateMnemonic(256); // Membuat 24 kata mnemonik
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const keypair = StellarSdk.Keypair.fromRawEd25519Seed(seed.slice(0, 32));

    const wallet = {
      mnemonic,
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret(),
    };

    console.log("✅ Dompet berhasil dibuat!");
    saveWalletToFile(wallet); // Simpan dompet ke file secara otomatis
    return wallet;
  } catch (error) {
    console.error("❌ Gagal membuat dompet:", error.message);
    throw error;
  }
}

/**
 * Memulihkan dompet dari frasa mnemonik dan menyimpannya ke file.
 * @param {string} mnemonic - 24 kata frasa mnemonik.
 * @returns {StellarSdk.Keypair} Objek Keypair Stellar.
 */
function restoreWalletFromMnemonic(mnemonic) {
  console.log("Memulihkan dompet dari mnemonik...");
  const trimmedMnemonic = mnemonic.trim().replace(/\s+/g, ' ');
  if (!bip39.validateMnemonic(trimmedMnemonic)) {
    throw new Error("Frasa mnemonik tidak valid. Pastikan ada 24 kata yang benar.");
  }
  try {
    const seed = bip39.mnemonicToSeedSync(trimmedMnemonic);
    const keypair = StellarSdk.Keypair.fromRawEd25519Seed(seed.slice(0, 32));
    
    const wallet = {
      mnemonic: trimmedMnemonic,
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret(),
    };

    console.log("✅ Dompet berhasil dipulihkan.");
    saveWalletToFile(wallet); // Simpan dompet ke file
    return keypair;
  } catch (error) {
    console.error("❌ Gagal memulihkan dompet:", error.message);
    throw error;
  }
}

/**
 * Memeriksa saldo dan informasi akun Pi.
 * @param {string} publicKey - Alamat publik dompet Pi.
 */
async function checkBalance(publicKey) {
  console.log(`🔍 Memeriksa saldo untuk akun: ${publicKey}`);
  try {
    const account = await server.loadAccount(publicKey);
    console.log("\n--- Informasi Akun ---");
    console.log(`Alamat: ${account.account_id}`);
    console.log(`Sequence: ${account.sequence}`);
    console.log("\n--- Saldo ---");
    account.balances.forEach(balance => {
      const formattedBalance = parseFloat(balance.balance).toLocaleString('en-US', { minimumFractionDigits: 7 });
      if (balance.asset_type === 'native') {
        console.log(`  Pi: ${formattedBalance} Pi`);
      } else {
        console.log(`  ${balance.asset_code}: ${formattedBalance} (Issuer: ${balance.asset_issuer})`);
      }
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("❌ Akun belum aktif. Akun harus menerima setidaknya 1 Pi untuk diaktifkan.");
    } else {
      console.error("❌ Gagal memeriksa saldo:", error.message);
    }
  }
}

/**
 * Melihat riwayat transaksi terakhir sebuah akun.
 * @param {string} publicKey - Alamat publik dompet Pi.
 * @param {number} limit - Jumlah transaksi yang ingin ditampilkan.
 */
async function getTransactionHistory(publicKey, limit = 10) {
    console.log(`🔍 Melihat ${limit} transaksi terakhir untuk: ${publicKey}`);
    try {
        const { records } = await server.transactions().forAccount(publicKey).limit(limit).order("desc").call();
        console.log("\n--- Riwayat Transaksi ---");
        if (records.length === 0) {
            console.log("Tidak ada riwayat transaksi.");
            return;
        }
        records.forEach((tx, index) => {
            console.log(`\n#${index + 1}`);
            console.log(`  Hash: ${tx.hash}`);
            console.log(`  Ledger: ${tx.ledger_attr}`);
            console.log(`  Timestamp: ${new Date(tx.created_at).toLocaleString()}`);
            console.log(`  Jumlah Operasi: ${tx.operation_count}`);
            console.log(`  Biaya: ${(parseInt(tx.fee_charged, 10) / 1e7).toFixed(7)} Pi`);
            console.log(`  Sukses: ${tx.successful}`);
            console.log(`  Memo: ${tx.memo ? tx.memo : 'Tidak ada'}`);
        });
    } catch (error) {
        console.error("❌ Gagal mengambil riwayat transaksi:", error.message);
    }
}

/**
 * Mengirim satu pembayaran Pi.
 * @param {string} secretKey - Kunci rahasia pengirim.
 * @param {string} destination - Alamat publik penerima.
 * @param {string} amount - Jumlah Pi yang akan dikirim.
 * @param {string} [memo] - Memo opsional.
 */
async function sendPayment(secretKey, destination, amount, memo) {
  console.log(`💸 Mempersiapkan pengiriman ${amount} Pi ke ${destination}...`);
  try {
    const sourceKeypair = StellarSdk.Keypair.fromSecret(secretKey);
    const account = await server.loadAccount(sourceKeypair.publicKey());

    const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: PI_NETWORK_PASSPHRASE,
      })
      .addOperation(StellarSdk.Operation.payment({
        destination,
        asset: StellarSdk.Asset.native(),
        amount,
      }))
      .setTimeout(30);

    if (memo) {
      transaction.addMemo(StellarSdk.Memo.text(memo));
    }

    const builtTransaction = transaction.build();
    builtTransaction.sign(sourceKeypair);

    console.log("Submitting transaksi ke jaringan Pi...");
    const result = await server.submitTransaction(builtTransaction);
    console.log("✅ Transaksi berhasil dikirim!");
    console.log("   Hash Transaksi:", result.hash);
    console.log("   Lihat di block explorer:", `https://blockexplorer.minepi.com/tx/${result.hash}`);
    return result;
  } catch (error) {
    const errorDetails = error.response ? error.response.data.extras.result_codes : error.message;
    console.error("❌ Pengiriman gagal:", errorDetails);
    throw error;
  }
}

/**
 * Mengirim pembayaran ke banyak alamat dalam satu transaksi.
 * @param {string} secretKey - Kunci rahasia pengirim.
 * @param {Array<{destination: string, amount: string}>} transfers - Array objek transfer.
 * @param {string} [memo] - Memo opsional.
 */
async function batchSendPayment(secretKey, transfers, memo) {
  console.log(`💸 Mempersiapkan transfer massal untuk ${transfers.length} alamat...`);
  if (transfers.length > 100) {
    throw new Error("Maksimal 100 operasi dalam satu transaksi.");
  }

  try {
    const sourceKeypair = StellarSdk.Keypair.fromSecret(secretKey);
    const account = await server.loadAccount(sourceKeypair.publicKey());

    const transactionBuilder = new StellarSdk.TransactionBuilder(account, {
        fee: (parseInt(StellarSdk.BASE_FEE, 10) * transfers.length).toString(),
        networkPassphrase: PI_NETWORK_PASSPHRASE,
    });

    transfers.forEach(transfer => {
        transactionBuilder.addOperation(StellarSdk.Operation.payment({
            destination: transfer.destination,
            asset: StellarSdk.Asset.native(),
            amount: transfer.amount,
        }));
    });

    if (memo) {
      transactionBuilder.addMemo(StellarSdk.Memo.text(memo));
    }
    
    const transaction = transactionBuilder.setTimeout(60).build();
    transaction.sign(sourceKeypair);

    console.log("Submitting transaksi massal ke jaringan Pi...");
    const result = await server.submitTransaction(transaction);

    console.log("✅ Transaksi massal berhasil dikirim!");
    console.log("   Hash Transaksi:", result.hash);
    console.log("   Lihat di block explorer:", `https://blockexplorer.minepi.com/tx/${result.hash}`);
    return result;
  } catch (error) {
    const errorDetails = error.response ? error.response.data.extras.result_codes : error.message;
    console.error("❌ Transfer massal gagal:", errorDetails);
    throw error;
  }
}

// --- FUNGSI-FUNGSI PEMBANTU ---

/**
 * Menyimpan detail dompet ke dalam file JSON.
 * @param {object} walletData - Objek berisi mnemonic, publicKey, dan secretKey.
 */
function saveWalletToFile(walletData) {
    const filename = `pi-wallet-${walletData.publicKey.slice(0, 8)}-${Date.now()}.json`;
    const dataToSave = {
        note: "SIMPAN FILE INI DENGAN AMAN. JANGAN BAGIKAN SECRET KEY ATAU MNEMONIC.",
        ...walletData,
        createdAt: new Date().toISOString()
    };

    fs.writeFileSync(filename, JSON.stringify(dataToSave, null, 2));
    console.log(`✅ Detail dompet tersimpan di file: ${filename}`);
}


/**
 * Fungsi utama untuk menjalankan bot dari command line.
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log("\n--- Pi Network Bot ---");

  switch (command) {
    case 'generate':
      const wallet = generateWallet();
      console.log("\n--- HASIL PEMBUATAN DOMPET ---");
      console.log("Frasa Mnemonik (simpan di tempat aman!):", wallet.mnemonic);
      console.log("Public Key (Alamat Dompet):", wallet.publicKey);
      console.log("Secret Key (JANGAN DIBAGIKAN!):", wallet.secretKey);
      break;

    case 'restore':
      const mnemonic = args.slice(1).join(' ');
      if (!mnemonic) {
        console.log("Penggunaan: node pi_bot.js restore <24 kata mnemonik>");
        return;
      }
      try {
        const keypair = restoreWalletFromMnemonic(mnemonic);
        console.log("\n--- HASIL PEMULIHAN DOMPET ---");
        console.log("Public Key (Alamat Dompet):", keypair.publicKey());
        console.log("Secret Key (JANGAN DIBAGIKAN!):", keypair.secret());
      } catch (e) {
        console.error(`❌ Error: ${e.message}`);
      }
      break;

    case 'balance':
      const publicKeyForBalance = args[1];
      if (!publicKeyForBalance) {
        console.log("Penggunaan: node pi_bot.js balance <public_key>");
        return;
      }
      await checkBalance(publicKeyForBalance);
      break;

    case 'history':
        const publicKeyForHistory = args[1];
        const limit = args[2] ? parseInt(args[2], 10) : 10;
        if (!publicKeyForHistory) {
            console.log("Penggunaan: node pi_bot.js history <public_key> [limit]");
            return;
        }
        await getTransactionHistory(publicKeyForHistory, limit);
        break;

    case 'send':
      const [secretKey, destination, amount, ...memoParts] = args.slice(1);
      const memo = memoParts.join(' ');
      if (!secretKey || !destination || !amount) {
        console.log("Penggunaan: node pi_bot.js send <secret_key> <destination_public_key> <amount> [memo]");
        return;
      }
      await sendPayment(secretKey, destination, amount, memo);
      break;

    case 'batchSend':
        const [batchSecretKey, filePath, ...batchMemoParts] = args.slice(1);
        const batchMemo = batchMemoParts.join(' ');
        if (!batchSecretKey || !filePath) {
            console.log("Penggunaan: node pi_bot.js batchSend <secret_key> <path_to_json_file> [memo]");
            return;
        }
        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const transfers = JSON.parse(fileContent);
            if (!Array.isArray(transfers)) {
                throw new Error("File JSON harus berisi array objek transfer.");
            }
            await batchSendPayment(batchSecretKey, transfers, batchMemo);
        } catch (e) {
            console.error(`❌ Gagal melakukan transfer massal: ${e.message}`);
        }
        break;

    default:
      console.log(`
Perintah tidak dikenal. Gunakan salah satu dari perintah berikut:

  - generate
    Membuat dompet Pi baru dan menyimpannya ke file JSON.

  - restore <24 kata mnemonik>
    Memulihkan dompet dari frasa mnemonik dan menyimpannya ke file.

  - balance <public_key>
    Memeriksa saldo akun.

  - history <public_key> [limit]
    Melihat riwayat transaksi terakhir (default 10).

  - send <secret_key> <destination> <amount> [memo]
    Mengirim Pi ke satu alamat.

  - batchSend <secret_key> <path_ke_file.json> [memo]
    Mengirim Pi ke banyak alamat dari file JSON.
      `);
  }
}

// Menjalankan fungsi utama
main().catch(() => {});
