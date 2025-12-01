import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: (email: string) => void;
}

export function AuthModal({ open, onOpenChange, onLogin }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите email",
        variant: "destructive",
      });
      return;
    }

    // Простая валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Ошибка",
        description: "Введите корректный email",
        variant: "destructive",
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите пароль",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Ошибка",
        description: "Пароль должен содержать минимум 6 символов",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isRegister) {
        // Регистрация
        if (!name.trim()) {
          toast({
            title: "Ошибка",
            description: "Введите имя",
            variant: "destructive",
          });
          return;
        }

        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, name, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          toast({
            title: "Ошибка",
            description: data.error === "User already exists" 
              ? "Пользователь с таким email уже существует"
              : data.error || "Ошибка регистрации",
            variant: "destructive",
          });
          return;
        }

        onLogin(`${name} <${email}>`);
        toast({
          title: "Регистрация успешна",
          description: `Добро пожаловать, ${name}!`,
        });
      } else {
        // Вход
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          toast({
            title: "Ошибка",
            description: data.error === "User not found"
              ? "Пользователь с таким email не найден"
              : data.error === "Invalid password"
              ? "Неверный пароль"
              : data.error || "Ошибка входа",
            variant: "destructive",
          });
          return;
        }

        onLogin(`${data.user.name} <${data.user.email}>`);
        toast({
          title: "Вход выполнен",
          description: `С возвращением, ${data.user.name}!`,
        });
      }
      
      onOpenChange(false);
      setEmail("");
      setName("");
      setPassword("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Не удалось выполнить операцию";
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <div className="flex gap-6">
          {/* Left side - Form */}
          <div className="flex-1">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">
                {isRegister ? "Регистрация" : "Вход в систему"}
              </DialogTitle>
              <DialogDescription>
                {isRegister 
                  ? "Создайте аккаунт для сохранения истории анализов"
                  : "Введите email для доступа к истории анализов"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {isRegister && (
                <div className="space-y-2">
                  <Label htmlFor="name">Имя</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Иван Иванов"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Минимум 6 символов"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isRegister ? "Зарегистрироваться" : "Войти"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-sm text-primary hover:underline"
              >
                {isRegister ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}
              </button>
            </div>

          </div>

          {/* Right side - Image */}
          <div className="hidden sm:flex items-center justify-center w-64">
            <img 
              src="/dal-portrait.png"
              alt="Владимир Даль"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
