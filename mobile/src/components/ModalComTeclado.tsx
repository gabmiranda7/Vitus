import React from 'react';
import { StyleSheet, ViewStyle, Platform } from 'react-native';
import { Modal, Portal, useTheme } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  contentContainerStyle?: ViewStyle;
}

export default function ModalComTeclado({ visible, onDismiss, children, contentContainerStyle }: Props) {
  const theme = useTheme();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modal,
          { backgroundColor: theme.colors.surface },
          contentContainerStyle,
        ]}
      >
        <KeyboardAwareScrollView
          enableOnAndroid
          enableAutomaticScroll
          extraScrollHeight={Platform.OS === 'android' ? 110 : 30}
          extraHeight={Platform.OS === 'android' ? 120 : 40}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </KeyboardAwareScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    maxHeight: '88%',
  },
});