import { useState, useEffect } from 'react';
import { 
  Tabs, 
  Form, 
  Input, 
  Button, 
  message, 
  Card,
  Divider,
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  SafetyOutlined,
  GithubOutlined,
} from '@ant-design/icons';
import { useRouter } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { trpc } from '@/router';
import {
  signUpSchema,
  signInEmailSchema,
  signInUsernameSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from '@bbs/db';

// Zod schema 转 Ant Design 验证规则 (Zod v4)
const createZodValidator = (schema: any, fieldName: string) => ({
  async validator(_: any, value: any) {
    const fieldSchema = schema.shape[fieldName];
    if (!fieldSchema) return;
    const result = fieldSchema.safeParse(value);
    if (!result.success) {
      throw new Error(result.error.issues[0]?.message);
    }
  },
});

// ==========================================
// 辅助组件：发送验证码按钮
// ==========================================
const SendCodeButton = ({ form, type }: { form: any, type: 'sign-in' | 'sign-up' | 'email-verification' }) => {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const sendOtpMutation = useMutation(trpc.auth.sendOtp.mutationOptions());

  const handleSendCode = async () => {
    const email = form.getFieldValue('email');
    const validation = sendOtpSchema.shape.email.safeParse(email);
    if (!validation.success) {
      message.error(validation.error.issues[0]?.message || '请输入有效邮箱');
      return;
    }
    try {
      const result = await sendOtpMutation.mutateAsync({ email, type });
      if (result.success) {
        setCountdown(60);
        message.success('验证码已发送');
      } else {
        message.error(result.errorDetail || '发送失败');
      }
    } catch (e: any) {
      message.error(e.message || '发送失败');
    }
  };

  return (
    <Button 
      disabled={countdown > 0} 
      loading={sendOtpMutation.isPending} 
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
  const [loginType, setLoginType] = useState<'email' | 'username' | 'otp'>('email');
  const [registerType, setRegisterType] = useState<'password' | 'otp'>('password');

  // tRPC mutations
  const signUpMutation = useMutation(trpc.auth.signUp.mutationOptions());
  const signInEmailMutation = useMutation(trpc.auth.signInEmail.mutationOptions());
  const signInUsernameMutation = useMutation(trpc.auth.signInUsername.mutationOptions());
  const verifyOtpMutation = useMutation(trpc.auth.verifyOtp.mutationOptions());

  const loading = signUpMutation.isPending || signInEmailMutation.isPending || 
                  signInUsernameMutation.isPending || verifyOtpMutation.isPending;

  // 通用成功回调
  const onSuccess = async () => {
    message.success('操作成功！');
    await router.invalidate(); 
    router.navigate({ to: '/' });
  };

  // ==================== 1. 邮箱密码登录 ====================
  const handleEmailLogin = async (values: any) => {
    try {
      const result = await signInEmailMutation.mutateAsync({
        email: values.email,
        password: values.password,
      });
      if (result.success) {
        onSuccess();
      } else {
        message.error(result.errorDetail || '登录失败');
      }
    } catch (e: any) {
      message.error(e.message || '登录失败');
    }
  };

  // ==================== 2. 用户名密码登录 ====================
  const handleUsernameLogin = async (values: any) => {
    try {
      const result = await signInUsernameMutation.mutateAsync({
        username: values.username,
        password: values.password,
      });
      if (result.success) {
        onSuccess();
      } else {
        message.error(result.errorDetail || '登录失败');
      }
    } catch (e: any) {
      message.error(e.message || '登录失败');
    }
  };

  // ==================== 3. 验证码登录 ====================
  const handleOtpLogin = async (values: any) => {
    try {
      const result = await verifyOtpMutation.mutateAsync({
        email: values.email,
        code: values.code,
        type: 'sign-in',
      });
      if (result.success) {
        onSuccess();
      } else {
        message.error(result.errorDetail || '验证失败');
      }
    } catch (e: any) {
      message.error(e.message || '验证失败');
    }
  };

  // ==================== 4. GitHub 登录 ====================
  const handleGithubLogin = async () => {
    try {
      const response = await fetch('/trpc/auth.githubAuthorize').then(r => r.json());
      const result = response.result?.data;
      if (result?.success && result?.data?.url) {
        window.location.href = result.data.url;
      } else {
        message.error(result?.errorDetail || '获取 GitHub 授权链接失败');
      }
    } catch (e: any) {
      message.error(e.message || 'GitHub 登录失败');
    }
  };

  // ==================== 5. 密码注册 ====================
  const handlePasswordRegister = async (values: any) => {
    try {
      const result = await signUpMutation.mutateAsync({
        email: values.email,
        password: values.password,
        name: values.name,
        username: values.username,
      });
      if (result.success) {
        onSuccess();
      } else {
        message.error(result.errorDetail || '注册失败');
      }
    } catch (e: any) {
      message.error(e.message || '注册失败');
    }
  };

  // ==================== 6. 验证码注册 ====================
  const handleOtpRegister = async (values: any) => {
    try {
      const result = await verifyOtpMutation.mutateAsync({
        email: values.email,
        code: values.code,
        type: 'sign-up',
        name: values.name,
      });
      if (result.success) {
        onSuccess();
      } else {
        message.error(result.errorDetail || '注册失败');
      }
    } catch (e: any) {
      message.error(e.message || '注册失败');
    }
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
          { key: 'email', label: '邮箱登录' },
          { key: 'username', label: '用户名登录' },
          { key: 'otp', label: '验证码登录' }
        ]}
      />
      
      {/* 邮箱密码登录 */}
      {loginType === 'email' && (
        <Form onFinish={handleEmailLogin} {...formLayout}>
          <Form.Item name="email" rules={[createZodValidator(signInEmailSchema, 'email')]}>
            <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[createZodValidator(signInEmailSchema, 'password')]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>登录</Button>
          </Form.Item>
        </Form>
      )}

      {/* 用户名密码登录 */}
      {loginType === 'username' && (
        <Form onFinish={handleUsernameLogin} {...formLayout}>
          <Form.Item name="username" rules={[createZodValidator(signInUsernameSchema, 'username')]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[createZodValidator(signInUsernameSchema, 'password')]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>登录</Button>
          </Form.Item>
        </Form>
      )}

      {/* 验证码登录 */}
      {loginType === 'otp' && (
        <Form onFinish={handleOtpLogin} {...formLayout}>
          <Form.Item name="email" rules={[createZodValidator(verifyOtpSchema, 'email')]}>
            <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />
          </Form.Item>
          <Form.Item>
            <Form.Item name="code" noStyle rules={[createZodValidator(verifyOtpSchema, 'code')]}>
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

      {/* GitHub 登录 */}
      <Divider plain>其他登录方式</Divider>
      <Button 
        icon={<GithubOutlined />} 
        onClick={handleGithubLogin}
        block 
        size="large"
      >
        使用 GitHub 登录
      </Button>
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

      {registerType === 'password' ? (
        <Form onFinish={handlePasswordRegister} {...formLayout}>
          <Form.Item name="username" rules={[createZodValidator(signUpSchema, 'username')]}>
            <Input prefix={<UserOutlined />} placeholder="用户名（用于登录）" size="large" />
          </Form.Item>
          <Form.Item name="name" rules={[createZodValidator(signUpSchema, 'name')]}>
            <Input prefix={<UserOutlined />} placeholder="昵称（显示名称）" size="large" />
          </Form.Item>
          <Form.Item name="email" rules={[createZodValidator(signUpSchema, 'email')]}>
            <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[createZodValidator(signUpSchema, 'password')]}>
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
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              注册并登录
            </Button>
          </Form.Item>
        </Form>
      ) : (
        <Form onFinish={handleOtpRegister} {...formLayout}>
          <Form.Item name="name" rules={[createZodValidator(verifyOtpSchema, 'name')]}>
            <Input prefix={<UserOutlined />} placeholder="昵称（显示名称）" size="large" />
          </Form.Item>
          <Form.Item name="email" rules={[createZodValidator(verifyOtpSchema, 'email')]}>
            <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />
          </Form.Item>
          <Form.Item>
            <Form.Item name="code" noStyle rules={[createZodValidator(verifyOtpSchema, 'code')]}>
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
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              注册并登录
            </Button>
          </Form.Item>
        </Form>
      )}

      {/* GitHub 注册 */}
      <Divider plain>其他注册方式</Divider>
      <Button 
        icon={<GithubOutlined />} 
        onClick={handleGithubLogin}
        block 
        size="large"
      >
        使用 GitHub 注册
      </Button>
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
