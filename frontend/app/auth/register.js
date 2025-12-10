const handleRegister = async () => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    Alert.alert("Lỗi đăng ký", error.message);
    return;
  }

  const user = data.user;

  // Nếu email confirmation đang bật → user=null → không insert được
  if (!user) {
    Alert.alert("Đăng ký thành công", "Vui lòng kiểm tra email để xác thực.");
    return;
  }

  // Insert profile + log lỗi
  const { error: insertError } = await supabase.from('profiles').insert({
    user_id: user.id,
    email: user.email,
    full_name: fullName
  });

  if (insertError) {
    console.log("Insert profile error:", insertError);
    Alert.alert("Lỗi", insertError.message);
    return;
  }

  Alert.alert("Thành công", "Tài khoản đã được tạo!");
  router.replace('/auth/login');
};
