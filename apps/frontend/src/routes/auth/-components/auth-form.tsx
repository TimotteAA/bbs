import React, { useState, useEffect } from 'react';
import { 
  Tabs, 
  Form, 
  Input, 
  Button, 
  message, 
  Card, 
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  SafetyOutlined 
} from '@ant-design/icons';
import { authClient } from '@/utils'; // 你的 auth client 路径
import { useRouter } from '@tanstack/react-router'; // 或者使用你的路由库

// ==========================================
// 辅助组件：发送验证码按钮
// ==========================================
const SendCodeButton = ({ form, type }: { form: any, type: 'sign-in' | 'sign-up' }) => {
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    console.log("form ", form, "type ", type);
    // try {
    //   // 1. 校验邮箱格式
    //   await form.validateFields(['email']);
    //   const email = form.getFieldValue('email');

    //   setLoading(true);
      
    //   // 2. 调用 Better-Auth 发送验证码
    //   // 注意：这需要后端启用 email-otp 插件
    //   const { error } = await authClient.emailOtp.sendVerificationOtp({
    //     email,
    //     type, // 'sign-in' | 'sign-up'
    //   });

    //   if (error) {
    //     message.error(error.message);
    //   } else {
    //     message.success('验证码已发送');
    //     setCountdown(60);
    //   }
    // } catch (err) {
    //     // Form 校验失败，不做处理
    // } finally {
    //   setLoading(false);
    // }
  };

  return (
    <Button 
      disabled={countdown > 0} 
      loading={loading} 
      onClick={handleSendCode}
    >
      {countdown > 0 ? `${countdown}s 后重试` : '获取验证码'}
    </Button>
  );
};

// ==========================================
// 主组件：AuthForms
// ==========================================
export const AuthForms = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loginType, setLoginType] = useState<'password' | 'otp'>('password');
  const [registerType, setRegisterType] = useState<'password' | 'otp'>('password');
  const [loading, setLoading] = useState(false);

  // 通用成功回调
  const onSuccess = async () => {
    message.success('操作成功！');
    // 如果用了 tanstack router，这里刷新状态
    await router.invalidate(); 
    router.navigate({ to: '/' });
  };

  // ==================== 1. 密码登录 ====================
  const handlePasswordLogin = async (values: any) => {
    setLoading(true);
    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });
    setLoading(false);
    if (error) return message.error(error.message);
    onSuccess();
  };

  // ==================== 2. 验证码登录 ====================
  const handleOtpLogin = async (values: any) => {
    setLoading(true);
    // 需要后端支持 email-otp
    // const { error } = await authClient.signIn.emailOtp({
    //   email: values.email,
    //   otp: values.code,
    // });
    setLoading(false);
    // if (error) return message.error(error.message);
    onSuccess();
  };

  // ==================== 3. 密码注册 ====================
  const handlePasswordRegister = async (values: any) => {
    setLoading(true);
    const { error } = await authClient.signUp.email({
      email: values.email,
      password: values.password,
      name: values.name,
    });
    setLoading(false);
    if (error) return message.error(error.message);
    onSuccess();
  };

  // ==================== 4. 验证码注册 ====================
  const handleOtpRegister = async (values: any) => {
    setLoading(true);
    // // 通常验证码注册即登录，或者先验证后创建
    // // 这里假设 better-auth 的 signUp 逻辑
    // const { error } = await authClient.signUp.emailOtp({
    //     email: values.email,
    //     otp: values.code,
    //     name: values.name
    // });

    // setLoading(false);
    // if (error) return message.error(error.message);
    onSuccess();
  };

  // 表单公共配置
  const formLayout = { wrapperCol: { span: 24 } };

  // 渲染登录表单
  const renderLoginForm = () => (
    <div>
      <Tabs 
        activeKey={loginType} 
        onChange={(k) => setLoginType(k as any)}
        centered
        items={[
          { key: 'password', label: '密码登录' },
          { key: 'otp', label: '验证码登录' }
        ]}
      />
      
      {loginType === 'password' ? (
        <Form onFinish={handlePasswordLogin} {...formLayout}>
          <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email' }]}>
            <Input prefix={<UserOutlined />} placeholder="邮箱" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>登录</Button>
          </Form.Item>
        </Form>
      ) : (
        <Form onFinish={handleOtpLogin} {...formLayout}>
          <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email' }]}>
            <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />
          </Form.Item>
          <Form.Item>
            <Form.Item name="code" noStyle rules={[{ required: true, message: '请输入验证码' }]}>
               <Input prefix={<SafetyOutlined />} placeholder="验证码" size="large" style={{ width: 'calc(100% - 110px)' }} />
            </Form.Item>
            <Form.Item noStyle shouldUpdate>
              {(form) => (
                 <span style={{ float: 'right' }}>
                    <SendCodeButton form={form} type="sign-in" />
                 </span>
              )}
            </Form.Item>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>登录</Button>
          </Form.Item>
        </Form>
      )}
    </div>
  );

  // 渲染注册表单
  const renderRegisterForm = () => (
    <div>
      <Tabs 
        activeKey={registerType} 
        onChange={(k) => setRegisterType(k as any)}
        centered
        items={[
          { key: 'password', label: '密码注册' },
          { key: 'otp', label: '验证码注册' }
        ]}
      />

      <Form 
        onFinish={registerType === 'password' ? handlePasswordRegister : handleOtpRegister} 
        {...formLayout}
      >
        <Form.Item name="name" rules={[{ required: true, message: '请输入昵称' }]}>
          <Input prefix={<UserOutlined />} placeholder="昵称 / 用户名" size="large" />
        </Form.Item>
        
        <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email' }]}>
          <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />
        </Form.Item>

        {registerType === 'password' ? (
           <>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="设置密码" size="large" />
            </Form.Item>
            <Form.Item 
                name="confirm" 
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致!'));
                    },
                  }),
                ]}
            >
                <Input.Password prefix={<LockOutlined />} placeholder="确认密码" size="large" />
            </Form.Item>
           </>
        ) : (
            <Form.Item>
                <Form.Item name="code" noStyle rules={[{ required: true, message: '请输入验证码' }]}>
                    <Input prefix={<SafetyOutlined />} placeholder="验证码" size="large" style={{ width: 'calc(100% - 110px)' }} />
                </Form.Item>
                <Form.Item noStyle shouldUpdate>
                    {(form) => (
                        <span style={{ float: 'right' }}>
                            <SendCodeButton form={form} type="sign-up" />
                        </span>
                    )}
                </Form.Item>
            </Form.Item>
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            注册并登录
          </Button>
        </Form.Item>
      </Form>
    </div>
  );

  return (
    <div style={{ maxWidth: 400, margin: '50px auto' }}>
      <Card bordered={false} className="shadow-lg rounded-xl">
        <Tabs 
          activeKey={activeTab} 
          onChange={(k) => setActiveTab(k as any)}
          size="large"
          centered
          items={[
            { key: 'login', label: '登录', children: renderLoginForm() },
            { key: 'register', label: '注册', children: renderRegisterForm() }
          ]}
        />
      </Card>
    </div>
  );
};