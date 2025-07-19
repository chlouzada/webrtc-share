import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react';

export const useNotifications = () => {
  const showSuccess = (message: string, title?: string) => {
    notifications.show({
      title: title || 'Sucesso',
      message,
      color: 'teal',
      icon: <IconCheck size={16} />,
    });
  };

  const showError = (message: string, title?: string) => {
    notifications.show({
      title: title || 'Erro',
      message,
      color: 'red',
      icon: <IconX size={16} />,
    });
  };

  const showWarning = (message: string, title?: string) => {
    notifications.show({
      title: title || 'Atenção',
      message,
      color: 'yellow',
      icon: <IconAlertTriangle size={16} />,
    });
  };

  const showInfo = (message: string, title?: string) => {
    notifications.show({
      title: title || 'Informação',
      message,
      color: 'blue',
      icon: <IconInfoCircle size={16} />,
    });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};