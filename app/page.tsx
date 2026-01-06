export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Campus Device Loan System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Borrow laptops, tablets, and cameras for your studies
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/devices"
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-lg"
            >
              Browse Devices
            </a>
            <a
              href="/signin"
              className="px-8 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-indigo-600 dark:border-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors font-medium text-lg"
            >
              Sign In
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-4xl mb-4">💻</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Wide Selection
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Access laptops, tablets, cameras, and other devices for your academic needs.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Secure & Easy
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Simple reservation process with secure authentication and tracking.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-4xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Stay Notified
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Join waitlists and get email notifications when devices become available.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Sign In
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Log in with your student account
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Reserve
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose and reserve your device
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Collect
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pick up from Campus IT office
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                4
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Return
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Return within 2 days
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-600 dark:text-gray-400">
          <p>Need help? Contact Campus IT Support</p>
        </div>
      </div>
    </div>
  );
}
