import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react';

export const useNotifications = () => {
  const showSuccess = (message: string, title?: string) => {
    notifications.show({
      title: title || 'Success',
      message,
      color: 'teal',
      icon: <IconCheck size={16} />,
    });
  };

  const showError = (message: string, title?: string) => {
    notifications.show({
      title: title || 'Error',
      message,
      color: 'red',
      icon: <IconX size={16} />,
    });
  };

  const showWarning = (message: string, title?: string) => {
    notifications.show({
      title: title || 'Warning',
      message,
      color: 'yellow',
      icon: <IconAlertTriangle size={16} />,
    });
  };

  const showInfo = (message: string, title?: string) => {
    notifications.show({
      title: title || 'Information',
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