import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import { useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"


export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")

  const navigate = useNavigate()

  const handleSignup = () => {
    if (password !== confirmPassword) {
      toast("Kata sandi tidak cocok", {
        duration: 2000,
        position: "top-center"
      })
      return
    }

    authClient.signUp.email({
      email: email,
      password: password,
      name: name,
    }, {
      onRequest: () => {
        
      },
      onSuccess: () => {
        toast("Pendaftaran berhasil", {
          duration: 1000,
          position: "top-center"
        })

        setEmail("")
        setPassword("")
        setConfirmPassword("")
        setName("")

        setTimeout(() => {
          navigate({
            to: "/auth/signin",
          })
        }, 1000)
      },
      onError: (error) => {
        toast(error.error.message, {
          duration: 2000,
          position: "top-center"
        })
      },
    })
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
        <form onSubmit={(e) => e.preventDefault()} className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Daftar</h1>
                <p className="text-muted-foreground text-balance">
                  Daftar ke akun {process.env.NEXT_PUBLIC_APP_NAME} Anda
                </p>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="name">Nama</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Kata Sandi</Label>
                </div>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}/>
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="confirm-password">Konfirmasi Kata Sandi</Label>
                </div>
                <Input id="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}/>
              </div>
              <Button onClick={handleSignup} type="submit" className="w-full">
                Daftar
              </Button>
              <div className="text-center text-sm">
                Sudah punya akun?{" "}
                <Link to="/auth/signin" className="underline underline-offset-4">
                  Masuk
                </Link>
              </div>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              width={500}
              height={500}
              src="/web/dummy.webp"
              alt="Gambar"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      {/* <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        Dengan mengklik lanjutkan, Anda menyetujui <Link href="#">Ketentuan Layanan</Link>{" "}
        dan <Link href="#">Kebijakan Privasi</Link> kami.
      </div> */}
    </div>
  )
}