(() => {
    const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
    const INTRO_REVEAL_EVENT = "wedding:intro-reveal";
    const INTRO_FINISHED_EVENT = "wedding:intro-finished";

    const prefersReducedMotion = () =>
        window.matchMedia(REDUCED_MOTION_QUERY).matches;

    function initLetteringReplay() {
        const lettering = document.querySelector(".main-lettering");
        const mainSection = document.querySelector(".main-section");
        const intro = document.getElementById("weddingIntro");

        if (!lettering || !mainSection) {
            return;
        }

        const source = lettering.getAttribute("src")?.split("?")[0];

        if (!source) {
            return;
        }

        let canPlay = !intro;
        let isMainSectionActive = false;

        const replay = () => {
            lettering.setAttribute(
                "src",
                `${source}?animation=${Date.now()}`
            );

            window.requestAnimationFrame(() => {
                lettering.classList.remove("is-waiting");
            });
        };

        const updateVisibility = (visibleRatio) => {
            const hasEntered = visibleRatio >= 0.55;

            if (hasEntered && !isMainSectionActive && canPlay) {
                replay();
            }

            if (visibleRatio < 0.2) {
                isMainSectionActive = false;
            } else if (hasEntered) {
                isMainSectionActive = true;
            }
        };

        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver(
                ([entry]) => updateVisibility(entry.intersectionRatio),
                { threshold: [0, 0.2, 0.55] }
            );

            observer.observe(mainSection);
        } else {
            const updateFromViewport = () => {
                const rect = mainSection.getBoundingClientRect();
                const visibleHeight =
                    Math.min(rect.bottom, window.innerHeight) -
                    Math.max(rect.top, 0);
                const visibleRatio = Math.max(
                    0,
                    visibleHeight / rect.height
                );

                updateVisibility(visibleRatio);
            };

            window.addEventListener("scroll", updateFromViewport, {
                passive: true
            });
            updateFromViewport();
        }

        if (intro) {
            window.addEventListener(
                INTRO_REVEAL_EVENT,
                () => {
                    canPlay = true;
                    isMainSectionActive = true;
                    replay();
                },
                { once: true }
            );
        }
    }

    function initParallax() {
        const banner = document.querySelector("[data-parallax]");
        const layer = banner?.querySelector("[data-parallax-layer]");

        if (!banner || !layer) {
            return;
        }

        const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
        let animationFrame = null;
        let isActive = false;

        const update = () => {
            animationFrame = null;

            if (reducedMotion.matches) {
                layer.style.setProperty("--parallax-y", "0px");
                return;
            }

            const rect = banner.getBoundingClientRect();
            const viewportHeight =
                window.visualViewport?.height || window.innerHeight;
            const rawProgress =
                (viewportHeight - rect.top) /
                (viewportHeight + rect.height);
            const progress = Math.min(1, Math.max(0, rawProgress));
            const offset = (progress - 0.5) * 190;

            layer.style.setProperty(
                "--parallax-y",
                `${offset.toFixed(2)}px`
            );
        };

        const requestUpdate = () => {
            if (!isActive || animationFrame !== null) {
                return;
            }

            animationFrame = window.requestAnimationFrame(update);
        };

        const setActive = (active) => {
            isActive = active;
            banner.classList.toggle(
                "is-parallax-active",
                active && !reducedMotion.matches
            );

            if (!active && animationFrame !== null) {
                window.cancelAnimationFrame(animationFrame);
                animationFrame = null;
            }

            if (active) {
                requestUpdate();
            }
        };

        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver(
                ([entry]) => setActive(entry.isIntersecting),
                { rootMargin: "30% 0px" }
            );

            observer.observe(banner);
        } else {
            setActive(true);
        }

        window.addEventListener("scroll", requestUpdate, {
            passive: true
        });
        window.addEventListener("resize", requestUpdate);
        window.visualViewport?.addEventListener("resize", requestUpdate);
        reducedMotion.addEventListener?.("change", () => {
            banner.classList.toggle(
                "is-parallax-active",
                isActive && !reducedMotion.matches
            );
            requestUpdate();
        });
    }

    function initCarousel(carousel) {
        const track = carousel.querySelector("[data-carousel-track]");
        const slides = Array.from(
            carousel.querySelectorAll("[data-carousel-slide]")
        );
        const previousButton = carousel.querySelector(
            "[data-carousel-prev]"
        );
        const nextButton = carousel.querySelector("[data-carousel-next]");
        const dotsContainer = carousel.querySelector(
            "[data-carousel-dots]"
        );
        const counter = carousel.querySelector("[data-carousel-counter]");

        if (!track || slides.length === 0) {
            return;
        }

        let currentIndex = 0;
        let pointerStartX = null;

        const showSlide = (index) => {
            currentIndex = (index + slides.length) % slides.length;
            track.style.transform =
                `translate3d(${-currentIndex * 100}%, 0, 0)`;

            slides.forEach((slide, slideIndex) => {
                slide.setAttribute(
                    "aria-hidden",
                    String(slideIndex !== currentIndex)
                );
            });

            dots.forEach((dot, dotIndex) => {
                const isActive = dotIndex === currentIndex;

                dot.classList.toggle("is-active", isActive);
                dot.setAttribute("aria-current", String(isActive));
            });

            if (counter) {
                counter.textContent =
                    `${currentIndex + 1} / ${slides.length}`;
            }
        };

        const dots = slides.map((_, index) => {
            const dot = document.createElement("button");

            dot.type = "button";
            dot.className = "gallery-dot";
            dot.setAttribute("aria-label", `${index + 1}번째 사진 보기`);
            dot.addEventListener("click", () => showSlide(index));
            dotsContainer?.append(dot);

            return dot;
        });

        previousButton?.addEventListener("click", () => {
            showSlide(currentIndex - 1);
        });
        nextButton?.addEventListener("click", () => {
            showSlide(currentIndex + 1);
        });

        carousel.tabIndex = 0;
        carousel.addEventListener("keydown", (event) => {
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                showSlide(currentIndex - 1);
            } else if (event.key === "ArrowRight") {
                event.preventDefault();
                showSlide(currentIndex + 1);
            }
        });

        carousel.addEventListener("pointerdown", (event) => {
            pointerStartX = event.clientX;
        });
        carousel.addEventListener("pointerup", (event) => {
            if (pointerStartX === null) {
                return;
            }

            const distance = event.clientX - pointerStartX;
            pointerStartX = null;

            if (Math.abs(distance) >= 42) {
                showSlide(
                    distance > 0
                        ? currentIndex - 1
                        : currentIndex + 1
                );
            }
        });
        carousel.addEventListener("pointercancel", () => {
            pointerStartX = null;
        });

        carousel.querySelectorAll("img").forEach((image) => {
            image.addEventListener("dragstart", (event) => {
                event.preventDefault();
            });
        });

        showSlide(0);
    }

    function initCarousels() {
        document
            .querySelectorAll("[data-carousel]")
            .forEach(initCarousel);
    }

    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const textarea = document.createElement("textarea");

            textarea.value = text;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.append(textarea);
            textarea.select();
            document.execCommand("copy");
            textarea.remove();
        }
    }

    function initAccountModal() {
        const modal = document.getElementById("accountModal");
        const title = document.getElementById("accountModalTitle");
        const bank = document.getElementById("accountModalBank");
        const number = document.getElementById("accountModalNumber");
        const owner = document.getElementById("accountModalOwner");
        const copyButton = modal?.querySelector("[data-copy-account]");
        const closeButton = modal?.querySelector("[data-account-close]");

        if (
            !modal ||
            !title ||
            !bank ||
            !number ||
            !owner ||
            !copyButton
        ) {
            return;
        }

        let opener = null;
        let copyResetTimer = null;

        const close = () => {
            if (typeof modal.close === "function") {
                modal.close();
            } else {
                modal.removeAttribute("open");
                document.body.classList.remove("has-account-modal");
                opener?.focus();
            }
        };

        document.querySelectorAll("[data-account-open]").forEach((button) => {
            button.addEventListener("click", () => {
                const accountOwner = button.dataset.accountOwner || "";
                const accountBank = button.dataset.accountBank || "";
                const accountNumber = button.dataset.accountNumber || "";

                opener = button;
                title.textContent = `${accountOwner} 계좌번호`;
                bank.textContent = accountBank;
                number.textContent = accountNumber;
                owner.textContent = `예금주 ${accountOwner}`;
                copyButton.dataset.copyAccount = accountNumber;
                copyButton.textContent = "계좌번호 복사";
                copyButton.classList.remove("is-copied");
                document.body.classList.add("has-account-modal");

                if (typeof modal.showModal === "function") {
                    modal.showModal();
                } else {
                    modal.setAttribute("open", "");
                }
            });
        });

        closeButton?.addEventListener("click", close);
        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                close();
            }
        });
        modal.addEventListener("close", () => {
            document.body.classList.remove("has-account-modal");
            opener?.focus();
        });

        copyButton.addEventListener("click", async () => {
            const accountNumber = copyButton.dataset.copyAccount;

            if (!accountNumber) {
                return;
            }

            await copyText(accountNumber);

            window.clearTimeout(copyResetTimer);
            copyButton.textContent = "복사되었습니다";
            copyButton.classList.add("is-copied");
            copyResetTimer = window.setTimeout(() => {
                copyButton.textContent = "계좌번호 복사";
                copyButton.classList.remove("is-copied");
            }, 1600);
        });
    }

    function initRoughMapCleanup() {
        const roughMap = document.querySelector(".root_daum_roughmap");

        if (!roughMap || !("MutationObserver" in window)) {
            return;
        }

        const removeDetails = () => {
            roughMap
                .querySelectorAll(".wrap_controllers")
                .forEach((details) => details.remove());
        };
        const observer = new MutationObserver(removeDetails);

        observer.observe(roughMap, {
            childList: true,
            subtree: true
        });
        removeDetails();
    }

    function initBackToTop() {
        const button = document.querySelector("[data-back-to-top]");
        const lastSection = document.querySelector(".map-section");

        if (!button || !lastSection) {
            return;
        }

        const setVisibility = (isVisible) => {
            button.classList.toggle("is-visible", isVisible);
            button.setAttribute("aria-hidden", String(!isVisible));
            button.tabIndex = isVisible ? 0 : -1;
        };

        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver(
                ([entry]) => setVisibility(entry.isIntersecting),
                { threshold: 0.08 }
            );

            observer.observe(lastSection);
        } else {
            const updateVisibility = () => {
                const rect = lastSection.getBoundingClientRect();

                setVisibility(
                    rect.top < window.innerHeight && rect.bottom > 0
                );
            };

            window.addEventListener("scroll", updateVisibility, {
                passive: true
            });
            updateVisibility();
        }

        button.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: prefersReducedMotion() ? "auto" : "smooth"
            });
        });
    }

    function initBgm() {
        const audio = document.querySelector("[data-bgm-audio]");
        const toggle = document.querySelector("[data-bgm-toggle]");
        const icon = toggle?.querySelector(".bi");
        const intro = document.getElementById("weddingIntro");
        let isStarting = false;
        let userPaused = false;

        if (!audio || !toggle || !icon) {
            return;
        }

        const revealButton = () => {
            toggle.classList.add("is-ready");
        };

        const syncButton = () => {
            const isPlaying = !audio.paused;

            toggle.classList.toggle("is-playing", isPlaying);
            toggle.setAttribute("aria-pressed", String(isPlaying));
            toggle.setAttribute(
                "aria-label",
                isPlaying ? "배경 음악 일시정지" : "배경 음악 재생"
            );
            icon.classList.toggle("bi-volume-mute", !isPlaying);
            icon.classList.toggle("bi-volume-up", isPlaying);
        };

        if (intro) {
            window.addEventListener(
                INTRO_FINISHED_EVENT,
                revealButton,
                { once: true }
            );
        } else {
            revealButton();
        }

        audio.volume = 0.45;
        syncButton();

        const removeUnlockListeners = () => {
            document.removeEventListener("pointerdown", unlockPlayback, true);
            document.removeEventListener("keydown", unlockPlayback, true);
        };

        const attemptAutoplay = async () => {
            if (userPaused || isStarting || !audio.paused) {
                return;
            }

            isStarting = true;

            try {
                await audio.play();
            } catch {
                syncButton();
            } finally {
                isStarting = false;
            }
        };

        function unlockPlayback(event) {
            if (
                event.target instanceof Element &&
                event.target.closest("[data-bgm-toggle]")
            ) {
                return;
            }

            void attemptAutoplay();
        }

        document.addEventListener("pointerdown", unlockPlayback, true);
        document.addEventListener("keydown", unlockPlayback, true);
        void attemptAutoplay();

        toggle.addEventListener("click", async () => {
            if (!audio.paused) {
                userPaused = true;
                removeUnlockListeners();
                audio.pause();
                return;
            }

            userPaused = false;

            try {
                await audio.play();
            } catch {
                syncButton();
                toggle.setAttribute(
                    "aria-label",
                    "배경 음악 파일을 불러올 수 없습니다"
                );
            }
        });

        audio.addEventListener("play", () => {
            removeUnlockListeners();
            syncButton();
        });
        audio.addEventListener("pause", syncButton);
    }

    initLetteringReplay();
    initParallax();
    initCarousels();
    initAccountModal();
    initRoughMapCleanup();
    initBackToTop();
    initBgm();
})();
