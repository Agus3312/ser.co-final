import { buildWhatsAppUrl, getActiveSocialLinks } from './contact.js';
import { siteConfig } from './site-config.js';
import './styles.css';

const whatsappUrl = buildWhatsAppUrl(siteConfig.whatsappPhone, siteConfig.whatsappMessage);
const socialLinks = getActiveSocialLinks({
  instagram: siteConfig.instagramUrl,
  whatsapp: whatsappUrl,
  facebook: siteConfig.facebookUrl
});

const menuToggle = document.querySelector('.menu-toggle');
const menuIcon = menuToggle.querySelector('.material-symbols-outlined');
const mobileMenu = document.querySelector('.mobile-menu');

menuToggle.addEventListener('click', () => {
  const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isExpanded));
  menuToggle.setAttribute('aria-label', isExpanded ? 'Abrir menú' : 'Cerrar menú');
  menuIcon.textContent = isExpanded ? 'menu' : 'close';
  mobileMenu.hidden = isExpanded;
});

mobileMenu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menú');
    menuIcon.textContent = 'menu';
    mobileMenu.hidden = true;
  });
});

const whatsappContact = document.querySelector('#whatsapp-contact');
const whatsappStatus = document.querySelector('#whatsapp-status');
if (whatsappUrl) {
  whatsappContact.href = whatsappUrl;
  whatsappContact.target = '_blank';
  whatsappContact.rel = 'noreferrer';
  whatsappContact.removeAttribute('aria-disabled');
  whatsappStatus.textContent = '';
} else {
  whatsappContact.classList.add('is-pending');
}

const socialContainer = document.querySelector('#social-links');
for (const { key, name, url } of socialLinks) {
  const link = document.createElement('a');
  link.className = 'social-link';
  link.href = url;
  link.target = '_blank';
  link.rel = 'noreferrer';
  link.textContent = name;
  link.setAttribute('aria-label', `Visitar ${name}`);
  link.dataset.channel = key;
  socialContainer.append(link);
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const processList = document.querySelector('.process-list');
const processSteps = [...document.querySelectorAll('.process-step')];

const storyStepButtons = [...document.querySelectorAll('.story-step-trigger')];
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

storyStepButtons.forEach((button) => {
  const step = button.closest('.story-step');
  const detail = document.getElementById(button.getAttribute('aria-controls'));
  let pinnedOpen = false;

  const setOpen = (isOpen) => {
    button.setAttribute('aria-expanded', String(isOpen));
    detail.setAttribute('aria-hidden', String(!isOpen));
    detail.inert = !isOpen;
    step.classList.toggle('is-open', isOpen);
  };

  button.addEventListener('click', () => {
    if (finePointer.matches) {
      pinnedOpen = !pinnedOpen;
      setOpen(pinnedOpen || step.matches(':hover') || step.matches(':focus-within'));
      return;
    }

    setOpen(button.getAttribute('aria-expanded') !== 'true');
  });

  step.addEventListener('mouseenter', () => {
    if (finePointer.matches) setOpen(true);
  });

  step.addEventListener('mouseleave', () => {
    if (finePointer.matches && !pinnedOpen && !step.matches(':focus-within')) setOpen(false);
  });

  step.addEventListener('focusin', () => {
    if (finePointer.matches) setOpen(true);
  });

  step.addEventListener('focusout', () => {
    window.requestAnimationFrame(() => {
      if (!pinnedOpen && !step.matches(':hover') && !step.matches(':focus-within')) setOpen(false);
    });
  });
});

if ('IntersectionObserver' in window && !prefersReducedMotion.matches) {
  document.documentElement.classList.add('motion-ready');

  document.querySelectorAll(
    '.intro-band p, .services .section-heading, .service-item, .work-top > *, ' +
    '.story-heading, .story-description, .story-step, .story-cta, .gallery-marquee, ' +
    '.process-heading, .process-step, .contact-copy, .contact-side'
  ).forEach((element) => {
    element.dataset.reveal = '';
  });

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  document.querySelectorAll('[data-reveal]').forEach((element) => revealObserver.observe(element));

  const visibleSteps = new Set();
  const processObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        visibleSteps.add(entry.target);
      } else {
        visibleSteps.delete(entry.target);
      }
    });

    const viewportFocus = window.innerHeight * 0.55;
    const activeStep = [...visibleSteps].sort((first, second) => {
      const firstDistance = Math.abs(first.getBoundingClientRect().top + first.offsetHeight / 2 - viewportFocus);
      const secondDistance = Math.abs(second.getBoundingClientRect().top + second.offsetHeight / 2 - viewportFocus);
      return firstDistance - secondDistance;
    })[0];

    processSteps.forEach((step) => step.classList.toggle('is-active', step === activeStep));
  }, { threshold: 0.5 });

  processSteps.forEach((step) => processObserver.observe(step));

  if (processList) {
    let progressFrame = 0;

    const updateProcessProgress = () => {
      progressFrame = 0;
      const bounds = processList.getBoundingClientRect();
      const focusPoint = window.innerHeight * 0.72;
      const progress = Math.min(1, Math.max(0, (focusPoint - bounds.top) / bounds.height));
      processList.style.setProperty('--process-progress', progress);
    };

    const scheduleProcessProgress = () => {
      if (!progressFrame) {
        progressFrame = window.requestAnimationFrame(updateProcessProgress);
      }
    };

    window.addEventListener('scroll', scheduleProcessProgress, { passive: true });
    window.addEventListener('resize', scheduleProcessProgress);
    scheduleProcessProgress();
  }
}

document.documentElement.classList.add('page-ready');