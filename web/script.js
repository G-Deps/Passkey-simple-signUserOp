document.getElementById("registerButton").addEventListener("click", register);
document.getElementById("loginButton").addEventListener("click", login);

function showMessage(message, isError = false) {
  const messageElement = document.getElementById("message");
  messageElement.textContent = message;
  messageElement.style.color = isError ? "red" : "green";
}

// ROUTES
async function register() {
  const username = document.getElementById("username").value;

  try {
    const response = await fetch("/api/passkey/registerStart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username }),
    });

    if (!response.ok) {
      const msg = await response.json();
      throw new Error(
        "User already exists or failed to get registration options from server: " +
          msg
      );
    }

    const options = await response.json();
    const attestationResponse = await SimpleWebAuthnBrowser.startRegistration(
      options.publicKey
    );

    console.log(options);
    console.log(attestationResponse);
    console.log(attestationResponse.response);

    console.log("Base 64 public key: ", attestationResponse.response.publicKey);

    const verificationResponse = await fetch("/api/passkey/registerFinish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(attestationResponse),
    });

    const msg = await verificationResponse.json();
    if (verificationResponse.ok) {
      showMessage(msg, false);
    } else {
      showMessage(msg, true);
    }
  } catch (error) {
    showMessage("Error: " + error.message, true);
  }
}

async function login() {
  const username = document.getElementById("username").value;
  const challenge = document.getElementById("challenge").value; //CHALLENGE IS THE USEROP HASH

  try {
    const response = await fetch("/api/passkey/loginStart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username, challenge: challenge }),
    });

    if (!response.ok) {
      const msg = await response.json();
      throw new Error("Failed to get login options from server: " + msg);
    }

    const options = await response.json();
    const assertionResponse = await SimpleWebAuthnBrowser.startAuthentication(
      options.publicKey
    );

    console.log(
      "clientDataJSON: ",
      assertionResponse.response.clientDataJSON,
      "signature: ",
      assertionResponse.response.signature,
      "authenticatorData: ",
      assertionResponse.response.authenticatorData
    );

    const verificationResponse = await fetch("/api/passkey/loginFinish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assertionResponse),
    });

    const msg = await verificationResponse.json();
    if (verificationResponse.ok) {
      showMessage(msg, false);
    } else {
      showMessage(msg, true);
    }
  } catch (error) {
    showMessage("Error: " + error.message, true);
  }
}
