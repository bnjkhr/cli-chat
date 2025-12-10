import blessed from 'blessed';
import { register, login } from '../services/api.js';

/**
 * Login/Register Screen
 */
export function createLoginScreen(screen, onSuccess) {
  const box = blessed.box({
    parent: screen,
    top: 'center',
    left: 'center',
    width: 60,
    height: 20,
    border: {
      type: 'line'
    },
    style: {
      border: {
        fg: 'cyan'
      }
    },
    label: ' CLI-CHAT Login ',
    tags: true
  });

  // Title
  blessed.text({
    parent: box,
    top: 1,
    left: 'center',
    content: '{bold}{cyan-fg}Welcome to CLI-CHAT{/cyan-fg}{/bold}',
    tags: true
  });

  // Mode Toggle
  let isLoginMode = true;

  const modeText = blessed.text({
    parent: box,
    top: 3,
    left: 'center',
    content: '{yellow-fg}Press TAB to switch between Login/Register{/yellow-fg}',
    tags: true
  });

  const modeLabel = blessed.text({
    parent: box,
    top: 5,
    left: 2,
    content: '{bold}Mode: LOGIN{/bold}',
    tags: true
  });

  // Email Input
  blessed.text({
    parent: box,
    top: 7,
    left: 2,
    content: 'Email:'
  });

  const emailInput = blessed.textbox({
    parent: box,
    top: 8,
    left: 2,
    width: '90%',
    height: 1,
    inputOnFocus: true,
    style: {
      bg: 'black',
      fg: 'white',
      focus: {
        bg: 'blue'
      }
    }
  });

  const passwordInput = blessed.textbox({
    parent: box,
    top: 11,
    left: 2,
    width: '90%',
    height: 1,
    inputOnFocus: true,
    censor: true,
    style: {
      bg: 'black',
      fg: 'white',
      focus: {
        bg: 'blue'
      }
    }
  });

  // Username Input (nur für Register)
  const usernameLabel = blessed.text({
    parent: box,
    top: 10,
    left: 2,
    content: 'Username:',
    hidden: true
  });

  const usernameInput = blessed.textbox({
    parent: box,
    top: 11,
    left: 2,
    width: '90%',
    height: 1,
    inputOnFocus: true,
    hidden: true,
    style: {
      bg: 'black',
      fg: 'white',
      focus: {
        bg: 'blue'
      }
    }
  });

  // Adjust password position for register mode
  const passwordLabel = blessed.text({
    parent: box,
    top: 10,
    left: 2,
    content: 'Password:'
  });

  // Error Message
  const errorText = blessed.text({
    parent: box,
    bottom: 2,
    left: 'center',
    content: '',
    style: {
      fg: 'red'
    }
  });

  // Instructions
  blessed.text({
    parent: box,
    bottom: 0,
    left: 'center',
    content: '{cyan-fg}Enter to Submit | Ctrl+C to Quit{/cyan-fg}',
    tags: true
  });

  function toggleMode() {
    isLoginMode = !isLoginMode;

    if (isLoginMode) {
      modeLabel.setContent('{bold}Mode: LOGIN{/bold}');
      usernameLabel.hide();
      usernameInput.hide();
      passwordLabel.top = 10;
      passwordInput.top = 11;
    } else {
      modeLabel.setContent('{bold}Mode: REGISTER{/bold}');
      usernameLabel.show();
      usernameInput.show();
      passwordLabel.top = 13;
      passwordInput.top = 14;
    }

    errorText.setContent('');
    screen.render();
  }

  async function handleSubmit() {
    const email = emailInput.getValue().trim();
    const password = passwordInput.getValue();
    const username = usernameInput.getValue().trim();

    errorText.setContent('');

    if (!email || !password) {
      errorText.setContent('{red-fg}Email and password required{/red-fg}');
      screen.render();
      return;
    }

    if (!isLoginMode && !username) {
      errorText.setContent('{red-fg}Username required for registration{/red-fg}');
      screen.render();
      return;
    }

    errorText.setContent('{yellow-fg}Connecting...{/yellow-fg}');
    screen.render();

    let result;
    if (isLoginMode) {
      result = await login(email, password);
    } else {
      result = await register(email, password, username);
    }

    if (result.success) {
      // Clean up key listener to prevent memory leak
      screen.unkey(['tab'], toggleMode);
      box.destroy();
      onSuccess(result.data);
    } else {
      errorText.setContent(`{red-fg}${result.error}{/red-fg}`);
      screen.render();
    }
  }

  // Key Bindings
  screen.key(['tab'], toggleMode);

  emailInput.key(['enter'], () => {
    if (isLoginMode) {
      passwordInput.focus();
    } else {
      usernameInput.focus();
    }
  });

  usernameInput.key(['enter'], () => {
    passwordInput.focus();
  });

  passwordInput.key(['enter'], handleSubmit);

  // Focus email input
  emailInput.focus();
  screen.render();

  return box;
}
