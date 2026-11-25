import { ErrorState } from "@/components/ErrorState";

export default function NotFound() {
  return (
    <ErrorState
      code="404"
      title="Страница не найдена"
      description="Такой ссылки нет — или её уже убрали."
      imageSrc="/errors/mascot-404.png"
      imageAlt="Персонаж у разбитого указателя"
      primary={{ href: "/", label: "На главную" }}
      secondary={{ href: "/projects", label: "Найти проект" }}
    />
  );
}
