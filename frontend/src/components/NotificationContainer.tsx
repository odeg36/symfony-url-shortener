import { memo } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, Bell } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { NotificationType } from '../types';

/**
 * Toast notification component with accessibility features
 */
export const NotificationContainer = memo(function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-4 right-4 z-50 space-y-2"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`
            rounded-lg shadow-lg p-4 min-w-80 max-w-md
            animate-slide-in-right
            ${getNotificationStyles(notification.type)}
          `}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              aria-label="Close notification"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
});

function getNotificationStyles(type: NotificationType): string {
  switch (type) {
    case NotificationType.SUCCESS:
      return 'bg-green-50 border border-green-200 text-green-900';
    case NotificationType.ERROR:
      return 'bg-red-50 border border-red-200 text-red-900';
    case NotificationType.WARNING:
      return 'bg-yellow-50 border border-yellow-200 text-yellow-900';
    case NotificationType.INFO:
      return 'bg-blue-50 border border-blue-200 text-blue-900';
    default:
      return 'bg-gray-50 border border-gray-200 text-gray-900';
  }
}

function getNotificationIcon(type: NotificationType): React.ReactElement {
  const iconProps = { className: 'w-5 h-5', 'aria-hidden': true };
  
  switch (type) {
    case NotificationType.SUCCESS:
      return <CheckCircle2 {...iconProps} />;
    case NotificationType.ERROR:
      return <XCircle {...iconProps} />;
    case NotificationType.WARNING:
      return <AlertTriangle {...iconProps} />;
    case NotificationType.INFO:
      return <Info {...iconProps} />;
    default:
      return <Bell {...iconProps} />;
  }
}
