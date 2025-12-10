import { useState } from 'react'
import { View, Text, TextInput, Pressable, Alert } from 'react-native'
import { supabase } from '../../supabase';
import { useRouter } from 'expo-router'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      Alert.alert("Lỗi đăng nhập", error.message)
      return
    }

    router.replace('/(tabs)');

  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 26, marginBottom: 20 }}>Đăng nhập</Text>

      <TextInput placeholder="Email" onChangeText={setEmail}
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput placeholder="Mật khẩu"
        secureTextEntry
        onChangeText={setPassword}
        style={styles.input}
      />

      <Pressable style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Đăng nhập</Text>
      </Pressable>

      <Text onPress={() => router.push('/auth/register')}
            style={{ marginTop: 15, textAlign: 'center' }}>
        Chưa có tài khoản? Đăng ký
      </Text>
    </View>
  )
}

const styles = {
  input: {
    borderWidth: 1, padding: 12, borderRadius: 10,
    marginBottom: 12
  },
  button: {
    backgroundColor: '#FF9800', padding: 15,
    borderRadius: 10
  },
  buttonText: { color: 'white', textAlign: 'center', fontSize: 16 }
}
