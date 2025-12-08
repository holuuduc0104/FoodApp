import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { supabase } from "../../supabase";
import { useRouter } from "expo-router";

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    if (isLogin) {
      // LOGIN
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return alert(error.message);

      router.replace("/(tabs)");
    } else {
      // REGISTER
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) return alert(error.message);

      const user = data.user;
      if (!user) return alert("Không lấy được user!"); 

      // 👉 LƯU USER VÀO BẢNG profiles
      const { error: insertError } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email,
      });

      if (insertError) {
        console.error(insertError);
        alert("Không lưu được vào bảng profiles!");
      }

      alert("Đăng ký thành công. Vui lòng đăng nhập!");
      setIsLogin(true);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? "Login" : "Register"}</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        onChangeText={setPassword}
      />

      <Pressable style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>
          {isLogin ? "Login" : "Register"}
        </Text>
      </Pressable>

      <Pressable onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.switchText}>
          {isLogin
            ? "Don't have an account? Register"
            : "Already have an account? Login"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F8FBF9",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2D6A4F",
    textAlign: "center",
    marginBottom: 36,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2D6A4F",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  buttonText: {
    color: "#FFF",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
  switchText: {
    marginTop: 20,
    textAlign: "center",
    color: "#2D6A4F",
    fontSize: 14,
    fontWeight: "500",
  },
});
