import { ErrorState } from "@/components/ErrorState";

export default function Forbidden() {
  return (
    <ErrorState
      code="403"
      title="Нет доступа"
      description="Этот раздел только для своего аккаунта."
      imageSrc="/errors/mascot-403.png"
      imageAlt="Персонаж за защитным щитом"
      primary={{ href: "/login", label: "Войти" }}
      secondary={{ href: "/", label: "На главную" }}
    />
  );
}
