import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ReactDOM from 'react-dom/client';
import './index.css'
import App from './App.jsx'
//import { init, miniApp, mainButton, shareURL } from '@telegram-apps/sdk';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

const rootElement = document.getElementById('root');
if (!rootElement) {
  document.body.innerHTML = '<h1 style="color:red">Ошибка: нет элемента #root</h1>';
} else {
  console.log('✅ Найден #root');
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}

const initializeTelegramSDK = async () => {
  try {
    await init();

    if (miniApp.ready.isAvailable()) {
      await miniApp.ready();
      console.log('Mini App готово');
    }

  } catch (error) {
    console.error('Ошибка инициализации:', error);
  }
};


// Монтируем главную кнопку
    if (mainButton.mount.isAvailable()) {
      mainButton.mount(); // Убедимся, что кнопка установлена
      console.log('Главная кнопка установлена');
    }

    // Настраиваем свойства главной кнопки
    if (mainButton.setParams.isAvailable()) {
      mainButton.setParams({
        backgroundColor: '#aa1388', // Цвет кнопки
        isEnabled: true, // Кнопка активна
        isVisible: true, // Кнопка видима
        text: 'Поделиться очками', // Текст на кнопке
        textColor: '#000000', // Цвет текста
      });
      console.log('Свойства главной кнопки настроены');
    }

    // Добавляем слушатель кликов на кнопку
    if (mainButton.onClick.isAvailable()) {
      mainButton.on('click', () => {
        try {
          // Получение текущих очков из localStorage
          const score = localStorage.getItem('memory-game-score') || 0;
          shareURL(`Посмотрите! У меня ${score} очков в игре!`);
          console.log('Окно выбора чата открыто для отправки сообщения.');
        } catch (error) {
          console.error('Ошибка при открытии окна выбора чата:', error);
        }
      });
    }

    
initializeTelegramSDK();


createRoot(document.getElementById('root')).render(
//  <StrictMode> 
    <App /> 
//    </StrictMode>,
)

miniApp.setHeaderColor('#fcb69f');