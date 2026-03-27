import { useEffect, useState } from 'react'

/**
 * Sayfa kaydırıldığında belirli elementlerin görünür olduğunda animasyon sınıfını ekleyen hook
 * @param threshold - Görünürlük eşiği (0-1 arası)
 * @param selector - Animasyon uygulanacak elementlerin CSS seçicisi
 */
export const useScrollAnimation = (
  threshold = 0.1,
  selector = '.animate-on-scroll',
) => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show')
          }
        })
      },
      { threshold },
    )

    const animatedElements = document.querySelectorAll(selector)
    animatedElements.forEach(el => observer.observe(el))

    return () => {
      animatedElements.forEach(el => observer.unobserve(el))
    }
  }, [threshold, selector])
}

/**
 * Sayfa kaydırıldığında header'ın görünümünü değiştiren hook
 * @param scrollThreshold - Kaydırma eşiği (piksel)
 * @returns - Sayfanın kaydırılıp kaydırılmadığı bilgisi
 */
export const useScrollHeader = (scrollThreshold = 10) => {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > scrollThreshold)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [scrollThreshold])

  return isScrolled
}
