import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  ViewStyle,
  Platform,
  Keyboard,
  useWindowDimensions,
} from "react-native";
import { Modal, Portal, useTheme } from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

interface Props {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  contentContainerStyle?: ViewStyle;
}

export default function ModalComTeclado({
  visible,
  onDismiss,
  children,
  contentContainerStyle,
}: Props) {
  const theme = useTheme();
  const { height: alturaTela } = useWindowDimensions();
  const [alturaTeclado, setAlturaTeclado] = useState(0);

  useEffect(() => {
    const eventoShow =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const eventoHide =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const subShow = Keyboard.addListener(eventoShow, (e) => {
      setAlturaTeclado(e.endCoordinates.height);
    });
    const subHide = Keyboard.addListener(eventoHide, () => {
      setAlturaTeclado(0);
    });

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      setAlturaTeclado(0);
    }
  }, [visible]);

  const espacoDisponivel = alturaTela - alturaTeclado - 48;
  const maxHeightCalculado =
    alturaTeclado > 0 ? Math.max(240, espacoDisponivel) : alturaTela * 0.88;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modal,
          {
            backgroundColor: theme.colors.surface,
            maxHeight: maxHeightCalculado,
            marginBottom: alturaTeclado > 0 ? alturaTeclado + 12 : 16,
          },
          contentContainerStyle,
        ]}
      >
        <KeyboardAwareScrollView
          enableOnAndroid
          enableAutomaticScroll
          extraScrollHeight={Platform.OS === "android" ? 40 : 20}
          extraHeight={Platform.OS === "android" ? 60 : 30}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {children}
        </KeyboardAwareScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
  },
  scrollContent: {
    paddingBottom: 8,
  },
});
