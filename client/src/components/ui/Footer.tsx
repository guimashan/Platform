export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer footer-center bg-base-200 text-base-content p-4">
      <aside>
        <p className="text-sm" data-testid="text-copyright">
          © {currentYear} 龜馬山整合服務平台 - 以科技服務信眾
        </p>
      </aside>
    </footer>
  );
}
