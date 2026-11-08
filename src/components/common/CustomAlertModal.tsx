import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useAlertStore, AlertButton, AlertType } from '../../store/useAlertStore';
import { useAppTheme } from '../../theme/useTheme';
import { triggerHaptic } from '../../utils/haptics';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  Info,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 48, 360);

export const CustomAlertModal: React.FC = () => {
  const { visible, type, title, message, buttons, hideAlert, onDismiss } = useAlertStore();
  const { colors, isDark } = useAppTheme();

  if (!visible) return null;

  const handleButtonPress = (btn: AlertButton) => {
    if (btn.style === 'destructive') {
      triggerHaptic('warning');
    } else {
      triggerHaptic('light');
    }
    hideAlert();
    btn.onPress?.();
  };

  const handleDismiss = () => {
    hideAlert();
    onDismiss?.();
  };

  const getStatusBadge = () => {
    switch (type) {
      case 'security':
        return {
          Icon: ShieldCheck,
          color: '#10B981',
          bg: 'rgba(16, 185, 129, 0.16)',
          border: 'rgba(16, 185, 129, 0.35)',
        };
      case 'warning':
        return {
          Icon: AlertTriangle,
          color: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.16)',
          border: 'rgba(245, 158, 11, 0.35)',
        };
      case 'danger':
      case 'error': {
        const isDelete =
          title.toLowerCase().includes('delete') ||
          title.toLowerCase().includes('remove') ||
          title.toLowerCase().includes('reset');
        return {
          Icon: isDelete ? Trash2 : AlertTriangle,
          color: '#EF4444',
          bg: 'rgba(239, 68, 68, 0.16)',
          border: 'rgba(239, 68, 68, 0.35)',
        };
      }
      case 'success':
        return {
          Icon: CheckCircle2,
          color: '#10B981',
          bg: 'rgba(16, 185, 129, 0.16)',
          border: 'rgba(16, 185, 129, 0.35)',
        };
      case 'info':
      default:
        return {
          Icon: Info,
          color: colors.accent,
          bg: colors.accentLight,
          border: colors.accent + '40',
        };
    }
  };

  const { Icon: BadgeIcon, color: badgeColor, bg: badgeBg, border: badgeBorder } =
    getStatusBadge();

  // Determine if 2 buttons should be rendered side-by-side or stacked
  const isSideBySide =
    buttons.length === 2 &&
    buttons.every((b) => (b.text || '').length <= 13);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={buttons.length === 1 ? handleDismiss : undefined}
        />

        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              borderColor: isDark ? '#334155' : 'rgba(0, 0, 0, 0.08)',
              shadowColor: isDark ? '#000000' : 'rgba(0, 0, 0, 0.25)',
            },
          ]}
        >
          {/* Status Icon Badge */}
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor: badgeBg,
                borderColor: badgeBorder,
              },
            ]}
          >
            <BadgeIcon size={28} color={badgeColor} strokeWidth={2.4} />
          </View>

          {/* Title */}
          <Text
            style={[
              styles.title,
              {
                color: isDark ? '#F8FAFC' : '#0F172A',
              },
            ]}
          >
            {title}
          </Text>

          {/* Subtitle / Message */}
          {Boolean(message) && (
            <Text
              style={[
                styles.message,
                {
                  color: isDark ? '#94A3B8' : '#64748B',
                },
              ]}
            >
              {message}
            </Text>
          )}

          {/* Action Buttons */}
          <View style={isSideBySide ? styles.buttonRow : styles.buttonColumn}>
            {buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';

              let btnBg = '#10B981';
              let btnBorder = 'transparent';
              let btnTextColor = '#FFFFFF';

              if (isDestructive) {
                btnBg = '#EF4444';
              } else if (isCancel) {
                btnBg = isDark ? '#1E293B' : '#F1F5F9';
                btnBorder = isDark ? '#334155' : '#E2E8F0';
                btnTextColor = isDark ? '#E2E8F0' : '#475569';
              }

              return (
                <TouchableOpacity
                  key={`${btn.text}-${index}`}
                  activeOpacity={0.8}
                  onPress={() => handleButtonPress(btn)}
                  style={[
                    styles.button,
                    isSideBySide && styles.flexButton,
                    {
                      backgroundColor: btnBg,
                      borderColor: btnBorder,
                      borderWidth: isCancel ? 1 : 0,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        color: btnTextColor,
                        fontWeight: isCancel ? '700' : '800',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20,
    zIndex: 9999,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  buttonColumn: {
    flexDirection: 'column',
    width: '100%',
    gap: 10,
  },
  button: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    width: '100%',
  },
  flexButton: {
    flex: 1,
    width: undefined,
  },
  buttonText: {
    fontSize: 15,
    letterSpacing: -0.2,
  },
});

