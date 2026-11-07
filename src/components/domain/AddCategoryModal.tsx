import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { X, Check, ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { useAppTheme } from '../../theme/useTheme';
import { Category } from '../../types';
import { useStore } from '../../store/useStore';
import {
  CATEGORY_ICON_OPTIONS,
  CATEGORY_COLOR_OPTIONS,
  getCategoryIconComponent,
} from '../../utils/categoryIcons';

interface AddCategoryModalProps {
  visible: boolean;
  initialType?: 'expense' | 'income';
  onClose: () => void;
  onSuccess?: (category: Category) => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  visible,
  initialType = 'expense',
  onClose,
  onSuccess,
}) => {
  const { colors } = useAppTheme();
  const addCategory = useStore((s) => s.addCategory);
  const categories = useStore((s) => s.categories);
  const setCategoryLimit = useStore((s) => s.setCategoryLimit);

  const [categoryType, setCategoryType] = useState<'expense' | 'income'>(initialType);
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('shopping-bag');
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLOR_OPTIONS[0]);

  // Keep type in sync if initialType changes when opened
  React.useEffect(() => {
    if (visible) {
      setCategoryType(initialType);
      setName('');
      setSelectedIcon(initialType === 'income' ? 'briefcase' : 'shopping-bag');
      setSelectedColor(initialType === 'income' ? '#047857' : '#0284c7');
    }
  }, [visible, initialType]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Category Name Required', 'Please enter a name for your custom category.');
      return;
    }

    // Check duplicate name in same category type
    const duplicate = categories.some(
      (c) =>
        c.category_type === categoryType &&
        c.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Duplicate Category', `A category named "${trimmed}" already exists.`);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newCategory = addCategory({
      name: trimmed,
      category_type: categoryType,
      color: selectedColor,
      icon: selectedIcon,
      is_default: false,
      sort_order: categories.length + 1,
    });

    // If expense, initialize a default cap limit of ₹5,000.00
    if (categoryType === 'expense') {
      setCategoryLimit(newCategory.id, 500000);
    }

    onSuccess?.(newCategory);
    onClose();
  };

  const PreviewIconComponent = getCategoryIconComponent(selectedIcon);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Add Category</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                Create custom spending or income group
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              accessibilityLabel="Close"
            >
              <X size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Category Type Selector (Expense vs Income) */}
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>CATEGORY TYPE</Text>
            <View style={[styles.typeSegment, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCategoryType('expense');
                }}
                style={[
                  styles.typeBtn,
                  categoryType === 'expense' && [
                    styles.typeBtnActive,
                    { backgroundColor: colors.surface },
                  ],
                ]}
              >
                <ArrowDownLeft
                  size={15}
                  color={categoryType === 'expense' ? colors.danger : colors.textMuted}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    {
                      color: categoryType === 'expense' ? colors.text : colors.textMuted,
                      fontWeight: categoryType === 'expense' ? '700' : '500',
                    },
                  ]}
                >
                  Expense
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCategoryType('income');
                }}
                style={[
                  styles.typeBtn,
                  categoryType === 'income' && [
                    styles.typeBtnActive,
                    { backgroundColor: colors.surface },
                  ],
                ]}
              >
                <ArrowUpRight
                  size={15}
                  color={categoryType === 'income' ? colors.success : colors.textMuted}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    {
                      color: categoryType === 'income' ? colors.text : colors.textMuted,
                      fontWeight: categoryType === 'income' ? '700' : '500',
                    },
                  ]}
                >
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            {/* Live Preview Card */}
            <View style={[styles.previewBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
              <View style={[styles.previewIconWrap, { backgroundColor: selectedColor }]}>
                <PreviewIconComponent size={20} color="#FFFFFF" />
              </View>
              <View style={styles.previewInfo}>
                <Text style={[styles.previewName, { color: colors.text }]}>
                  {name.trim() || 'Category Name'}
                </Text>
                <Text style={[styles.previewTag, { color: colors.textMuted }]}>
                  {categoryType.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Category Name Input */}
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>CATEGORY NAME</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Subscriptions, Fuel, Pet Care..."
              placeholderTextColor={colors.textMuted + '80'}
              maxLength={30}
              style={[
                styles.nameInput,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />

            {/* Color Swatches */}
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>THEME COLOR</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.colorRow}
            >
              {CATEGORY_COLOR_OPTIONS.map((c) => {
                const isSelected = selectedColor === c;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedColor(c);
                    }}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: c },
                      isSelected && styles.colorCircleSelected,
                    ]}
                  >
                    {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Vector Icon Grid */}
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>CHOOSE ICON</Text>
            <View style={styles.iconGrid}>
              {CATEGORY_ICON_OPTIONS.map((item) => {
                const isSelected = selectedIcon === item.id;
                const IconComp = item.icon;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedIcon(item.id);
                    }}
                    style={[
                      styles.iconTile,
                      {
                        backgroundColor: isSelected ? selectedColor + '18' : colors.surfaceSubtle,
                        borderColor: isSelected ? selectedColor : colors.border,
                      },
                    ]}
                  >
                    <IconComp
                      size={20}
                      color={isSelected ? selectedColor : colors.textMuted}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.iconLabel,
                        {
                          color: isSelected ? colors.text : colors.textMuted,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer Save Button */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.cancelBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: colors.accent }]}
            >
              <Text style={[styles.saveBtnText, { color: colors.onAccent }]}>Save Category</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    maxHeight: '90%',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 14,
  },
  typeSegment: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 11,
  },
  typeBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  typeBtnText: {
    fontSize: 13,
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    gap: 12,
  },
  previewIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 15,
    fontWeight: '700',
  },
  previewTag: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  nameInput: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '600',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 2,
  },
  colorCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconTile: {
    width: '23%',
    aspectRatio: 1.15,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    gap: 4,
  },
  iconLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
});

